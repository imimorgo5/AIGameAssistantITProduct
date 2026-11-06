package ru.project.gameAssistantBackend.ai;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@EnableConfigurationProperties(AiProperties.class)
public class ModelCatalog {
    private final AiProperties properties;
    private final Map<String, AiProperties.Model> models = new LinkedHashMap<>();

    public ModelCatalog(AiProperties properties) {
        this.properties = properties;
        for (var model : properties.models()) {
            if (models.putIfAbsent(model.id(), model) != null) {
                throw new IllegalArgumentException("Duplicate model ID in ai-models.yaml: " + model.id());
            }
        }
        requireEnabled(properties.defaultModel());
    }

    public AiProperties.Model requireEnabled(String id) {
        var model = models.get(id);
        if (model == null || !model.enabled()) {
            throw new IllegalArgumentException("Выбранная модель недоступна. Обновите список моделей");
        }
        return model;
    }

    public boolean isEnabled(String id) {
        return id != null && models.containsKey(id) && models.get(id).enabled();
    }

    public AiProperties.Model resolve(String preferred, String systemDefault) {
        if (isEnabled(preferred)) return models.get(preferred);
        if (isEnabled(systemDefault)) return models.get(systemDefault);
        return requireEnabled(properties.defaultModel());
    }

    public List<Option> options() {
        return models.values().stream().filter(AiProperties.Model::enabled)
                .map(m -> new Option(m.id(), m.name(), m.maxOutputTokens())).toList();
    }

    public record Option(String id, String name, int maxOutputTokens) {}
}
