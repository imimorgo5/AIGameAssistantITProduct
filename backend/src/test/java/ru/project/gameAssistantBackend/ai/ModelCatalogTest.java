package ru.project.gameAssistantBackend.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;

class ModelCatalogTest {
    @Test
    void importsOnceAndKeepsDefaultAndPreferencesConsistent() {
        var source = new DriverManagerDataSource();
        source.setUrl(
                "jdbc:h2:mem:catalog" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1");
        var db = new JdbcTemplate(source);
        db.execute(
                "CREATE TABLE ai_catalog_state(id INT PRIMARY KEY,initialized BOOLEAN); INSERT INTO"
                    + " ai_catalog_state VALUES(1,false)");
        db.execute(
                "CREATE TABLE ai_model(id VARCHAR PRIMARY KEY,name VARCHAR,remote_id VARCHAR"
                    + " UNIQUE,enabled BOOLEAN,max_output_tokens INT)");
        db.execute(
                "CREATE TABLE system_properties(id INT PRIMARY KEY,model VARCHAR); INSERT INTO"
                    + " system_properties VALUES(1,'fast')");
        db.execute(
                "CREATE TABLE uzer(id INT PRIMARY KEY,model VARCHAR); INSERT INTO uzer"
                    + " VALUES(1,'fast')");
        var fast = new AiProperties.Model("fast", "Fast", "vendor/fast", true, 2000);
        var off = new AiProperties.Model("off", "Off", "vendor/off", false, 2000);
        var properties =
                new AiProperties(
                        "fast",
                        List.of(fast, off),
                        new AiProperties.OpenRouter("", "https://openrouter.ai/api/v1", 60),
                        200000);
        var router = mock(OpenRouterClient.class);
        when(router.catalog())
                .thenReturn(List.of(new OpenRouterClient.CatalogOption("vendor/new", "New", 4096, null, null)));
        var service =
                new ModelCatalog(
                        properties,
                        db,
                        new TransactionTemplate(new DataSourceTransactionManager(source)),
                        router);
        service.afterPropertiesSet();
        assertEquals(fast, service.resolve("removed", null));
        assertThrows(IllegalArgumentException.class, () -> service.requireEnabled("off"));
        assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.change("fast", null, true, false));
        service.add("vendor/new", "New", 4096);
        assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.add("vendor/new", "Duplicate", 4096));
        service.change("fast", false, false, false);
        assertNotEquals("fast", service.defaultId());
        assertNull(db.queryForObject("SELECT model FROM uzer WHERE id=1", String.class));
        service.change("fast", null, true, false);
        service.afterPropertiesSet();
        assertFalse(service.all().stream().anyMatch(model -> model.id().equals("fast")));
        assertEquals(2, service.all().size());
    }
}
