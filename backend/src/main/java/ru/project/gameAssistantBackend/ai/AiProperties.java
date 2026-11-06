package ru.project.gameAssistantBackend.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@ConfigurationProperties("ai")
@Validated
public record AiProperties(
        @NotBlank String defaultModel,
        @NotEmpty @Valid List<Model> models,
        @NotNull @Valid OpenRouter openrouter,
        @DefaultValue("200000") @Positive int maxInputChars) {
    public record Model(
            @NotBlank @Pattern(regexp = "[a-z0-9][a-z0-9_-]{0,63}") String id,
            @NotBlank String name,
            @NotBlank @Size(max = 256) String remoteId,
            @DefaultValue("true") boolean enabled,
            @DefaultValue("2000") @Min(1) @Max(32000) int maxOutputTokens) {}

    public record OpenRouter(
            @DefaultValue("") String apiKey,
            @DefaultValue("https://openrouter.ai/api/v1") @NotBlank String baseUrl,
            @DefaultValue("60") @Min(5) @Max(300) int timeoutSeconds) {}
}
