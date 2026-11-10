package ru.project.gameAssistantBackend.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class GuestQuotaService {
    private final JdbcTemplate db;
    private final String secret;
    private final int budget;

    public GuestQuotaService(
            JdbcTemplate db,
            @Value("${jwt.secret.access}") String secret,
            @Value("${ai.guest.daily-budget:200}") int budget) {
        this.db = db;
        this.secret = secret;
        this.budget = Math.max(5, Math.min(10000, budget));
    }

    @Transactional
    public Status quota(String identity, String address, boolean consume) {
        db.queryForObject("SELECT id FROM guest_quota_lock WHERE id=1 FOR UPDATE", Integer.class);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        var limits = new LinkedHashMap<String, Integer>();
        limits.put("guest:" + identity, 5);
        if (address != null && !address.isBlank()) limits.put("address:" + hash(address), 20);
        limits.put("global", budget);
        int remaining = 5;
        Instant last = null;
        for (var entry : limits.entrySet()) {
            var counters =
                    db.query(
                            "SELECT used,last_request FROM guest_quota WHERE bucket=? AND"
                                + " quota_day=?",
                            (rs, row) ->
                                    new Counter(
                                            rs.getInt(1),
                                            rs.getTimestamp(2) == null
                                                    ? null
                                                    : rs.getTimestamp(2).toInstant()),
                            entry.getKey(),
                            today);
            int used = counters.isEmpty() ? 0 : counters.getFirst().used();
            remaining = Math.min(remaining, entry.getValue() - used);
            if (entry.getKey().startsWith("guest:") && !counters.isEmpty())
                last = counters.getFirst().last();
        }
        if (consume) {
            if (remaining <= 0)
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Гостевой лимит исчерпан. Зарегистрируйтесь или вернитесь завтра");
            if (last != null && last.plusSeconds(10).isAfter(Instant.now()))
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Подождите 10 секунд перед следующим вопросом");
            for (String key : limits.keySet())
                db.update(
                        "INSERT INTO guest_quota (bucket,quota_day,used,last_request) VALUES"
                            + " (?,?,1,CURRENT_TIMESTAMP) ON CONFLICT (bucket) DO UPDATE SET"
                            + " quota_day=EXCLUDED.quota_day, used=CASE WHEN"
                            + " guest_quota.quota_day=EXCLUDED.quota_day THEN guest_quota.used+1"
                            + " ELSE 1 END,last_request=CURRENT_TIMESTAMP",
                        key,
                        today);
            db.update("DELETE FROM guest_quota WHERE quota_day < ?", today.minusDays(2));
        }
        return new Status(
                Math.max(0, remaining - (consume ? 1 : 0)),
                5,
                today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private String hash(String address) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(address.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception error) {
            throw new IllegalStateException("Не удалось проверить гостевой лимит", error);
        }
    }

    private record Counter(int used, Instant last) {}

    public record Status(int remaining, int limit, Instant resetsAt) {}
}
