package ru.project.gameAssistantBackend.ai;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Component
@EnableConfigurationProperties(AiProperties.class)
public class ModelCatalog implements InitializingBean {
    private final AiProperties properties;
    private final JdbcTemplate db;
    private final TransactionTemplate transactions;
    private final OpenRouterClient router;

    public ModelCatalog(
            AiProperties properties,
            JdbcTemplate db,
            TransactionTemplate transactions,
            OpenRouterClient router) {
        this.properties = properties;
        this.db = db;
        this.transactions = transactions;
        this.router = router;
    }

    @Override
    public void afterPropertiesSet() {
        transactions.executeWithoutResult(
                tx -> {
                    lock();
                    if (Boolean.TRUE.equals(
                            db.queryForObject(
                                    "SELECT initialized FROM ai_catalog_state WHERE id=1",
                                    Boolean.class))) return;
                    for (var model : properties.models()) {
                        db.update(
                                "INSERT INTO ai_model (id,name,remote_id,enabled,max_output_tokens)"
                                        + " VALUES (?,?,?,?,?)",
                                model.id(),
                                model.name(),
                                model.remoteId(),
                                model.enabled(),
                                model.maxOutputTokens());
                    }
                    String existing =
                            db
                                    .query(
                                            "SELECT model FROM system_properties ORDER BY id",
                                            (rs, row) -> rs.getString(1))
                                    .stream()
                                    .filter(java.util.Objects::nonNull)
                                    .findFirst()
                                    .orElse(properties.defaultModel());
                    String selected =
                            isEnabled(existing)
                                    ? existing
                                    : options().stream().map(Option::id).findFirst().orElse(null);
                    db.update("UPDATE system_properties SET model=?", selected);
                    db.update("UPDATE ai_catalog_state SET initialized=true WHERE id=1");
                });
    }

    private void lock() {
        db.queryForObject("SELECT id FROM ai_catalog_state WHERE id=1 FOR UPDATE", Integer.class);
    }

    public List<AiProperties.Model> all() {
        return db.query(
                "SELECT * FROM ai_model ORDER BY name,id",
                (rs, row) ->
                        new AiProperties.Model(
                                rs.getString("id"),
                                rs.getString("name"),
                                rs.getString("remote_id"),
                                rs.getBoolean("enabled"),
                                rs.getInt("max_output_tokens")));
    }

    public AiProperties.Model requireEnabled(String id) {
        return all().stream()
                .filter(m -> m.enabled() && m.id().equals(id))
                .findFirst()
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Выбранная модель недоступна. Обновите список моделей"));
    }

    public boolean isEnabled(String id) {
        return all().stream().anyMatch(m -> m.enabled() && m.id().equals(id));
    }

    public AiProperties.Model resolve(String preferred, String systemDefault) {
        if (isEnabled(preferred)) return requireEnabled(preferred);
        if (isEnabled(systemDefault)) return requireEnabled(systemDefault);
        return all().stream()
                .filter(AiProperties.Model::enabled)
                .findFirst()
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "Нет доступной модели. Обратитесь к администратору"));
    }

    public List<Option> options() {
        return all().stream()
                .filter(AiProperties.Model::enabled)
                .map(m -> new Option(m.id(), m.name(), m.maxOutputTokens()))
                .toList();
    }

    public String defaultId() {
        return db
                .query(
                        "SELECT model FROM system_properties ORDER BY id",
                        (rs, row) -> rs.getString(1))
                .stream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public Registry registry() {
        return new Registry(all(), defaultId());
    }

    public record Registry(List<AiProperties.Model> models, String defaultModel) {}

    public void add(String remoteId, String name, int tokens) {
        var remote =
                router.catalog().stream()
                        .filter(m -> m.id().equals(remoteId))
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Модель отсутствует в каталоге OpenRouter"));
        if (tokens > remote.maxOutputTokens())
            throw new IllegalArgumentException(
                    "Модель поддерживает не более " + remote.maxOutputTokens() + " токенов ответа");
        transactions.executeWithoutResult(
                tx -> {
                    lock();
                    if (all().stream().anyMatch(m -> m.remoteId().equals(remoteId)))
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT, "Эта модель уже добавлена");
                    String id = UUID.randomUUID().toString();
                    db.update(
                            "INSERT INTO ai_model (id,name,remote_id,enabled,max_output_tokens)"
                                    + " VALUES (?,?,?,true,?)",
                            id,
                            name.strip(),
                            remoteId,
                            tokens);
                    if (defaultId() == null) db.update("UPDATE system_properties SET model=?", id);
                });
    }

    public void change(String id, Boolean enabled, boolean delete, boolean main) {
        transactions.executeWithoutResult(
                tx -> {
                    lock();
                    var model =
                            all().stream()
                                    .filter(m -> m.id().equals(id))
                                    .findFirst()
                                    .orElseThrow(
                                            () ->
                                                    new ResponseStatusException(
                                                            HttpStatus.NOT_FOUND,
                                                            "Модель не найдена"));
                    if (main) {
                        requireEnabled(id);
                        db.update("UPDATE system_properties SET model=?", id);
                        return;
                    }
                    boolean disabling = delete || Boolean.FALSE.equals(enabled);
                    var alternatives = options().stream().filter(m -> !m.id().equals(id)).toList();
                    if (disabling && model.enabled() && alternatives.isEmpty())
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Добавьте или включите другую модель перед отключением последней");
                    if (delete) db.update("DELETE FROM ai_model WHERE id=?", id);
                    else db.update("UPDATE ai_model SET enabled=? WHERE id=?", enabled, id);
                    if (disabling) {
                        db.update("UPDATE uzer SET model=NULL WHERE model=?", id);
                        if (id.equals(defaultId()))
                            db.update(
                                    "UPDATE system_properties SET model=?",
                                    alternatives.isEmpty() ? null : alternatives.getFirst().id());
                    }
                });
    }

    public void updatePreference(Long userId, String model) {
        transactions.executeWithoutResult(
                tx -> {
                    lock();
                    requireEnabled(model);
                    db.update("UPDATE uzer SET model=? WHERE id=?", model, userId);
                });
    }

    public record Option(String id, String name, int maxOutputTokens) {}
}
