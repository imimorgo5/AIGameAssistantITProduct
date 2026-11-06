package ru.project.gameAssistantBackend.ai;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ModelCatalogTest {
    private final AiProperties.Model fast = new AiProperties.Model("fast", "Fast", "vendor/fast", true, 2000);
    private final AiProperties.Model off = new AiProperties.Model("off", "Off", "vendor/off", false, 2000);
    private AiProperties properties(String defaultId, List<AiProperties.Model> models) {
        return new AiProperties(defaultId, models, new AiProperties.OpenRouter("", "https://openrouter.ai/api/v1", 60), 200000);
    }

    @Test void allowsOnlyEnabledModelsAndRecoversStalePreferences() {
        ModelCatalog catalog = new ModelCatalog(properties("fast", List.of(fast, off)));
        assertEquals(List.of(new ModelCatalog.Option("fast", "Fast", 2000)), catalog.options());
        assertThrows(IllegalArgumentException.class, () -> catalog.requireEnabled("off"));
        assertThrows(IllegalArgumentException.class, () -> catalog.requireEnabled("arbitrary/expensive-model"));
        assertEquals(fast, catalog.resolve("removed", "off"));
        assertEquals(fast, catalog.resolve(null, null));
    }

    @Test void rejectsDuplicateIdsAndUnavailableDefault() {
        assertThrows(IllegalArgumentException.class, () -> new ModelCatalog(properties("fast", List.of(fast, fast))));
        assertThrows(IllegalArgumentException.class, () -> new ModelCatalog(properties("off", List.of(fast, off))));
    }
}
