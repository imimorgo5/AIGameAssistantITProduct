package ru.project.gameAssistantBackend.ai;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

@Service
public class ChatGenerationGuard {
    private final JdbcTemplate db;

    public ChatGenerationGuard(JdbcTemplate db) {
        this.db = db;
    }

    @Transactional
    public void requireIdle(Long id) {
        var leases =
                db.query(
                        "SELECT generation_until FROM chat WHERE id=? FOR UPDATE",
                        (rs, row) -> rs.getTimestamp(1),
                        id);
        if (leases.isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Чат не найден");
        if (leases.getFirst() != null && leases.getFirst().toInstant().isAfter(Instant.now()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Дождитесь завершения ответа");
    }

    @Transactional
    public String claim(Long id) {
        requireIdle(id);
        var roles =
                db.query(
                        "SELECT role FROM message WHERE chat_id=? ORDER BY timestamp DESC,id DESC"
                            + " LIMIT 1",
                        (rs, row) -> rs.getString(1),
                        id);
        if (roles.isEmpty() || !roles.getFirst().equals("user"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Сначала задайте вопрос");
        String token = UUID.randomUUID().toString();
        db.update(
                "UPDATE chat SET generation_until=?,generation_token=? WHERE id=?",
                Timestamp.from(Instant.now().plusSeconds(300)),
                token,
                id);
        return token;
    }

    public void release(Long id, String token) {
        db.update(
                "UPDATE chat SET generation_until=NULL,generation_token=NULL WHERE id=? AND"
                    + " generation_token=?",
                id,
                token);
    }
}
