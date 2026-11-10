package ru.project.gameAssistantBackend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Flux;

import ru.project.gameAssistantBackend.models.Message;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.function.Consumer;

@Service
public class OpenRouterClient {
    private final WebClient client;
    private final AiProperties properties;
    private final ObjectMapper json;

    public OpenRouterClient(
            @Qualifier("openRouterWebClient") WebClient client,
            AiProperties properties,
            ObjectMapper json) {
        this.client = client;
        this.properties = properties;
        this.json = json;
    }

    public Flux<String> stream(
            AiProperties.Model model,
            List<Message> messages,
            Consumer<GenerationResult> onComplete) {
        // Copy JPA entities while the request's persistence context is still open.
        var context =
                messages.stream()
                        .map(m -> Map.of("role", m.getRole().name(), "content", m.getText()))
                        .toList();
        long characters = messages.stream().mapToLong(m -> m.getText().length()).sum();
        return Flux.defer(
                        () -> {
                            if (properties.openrouter().apiKey().isBlank()) {
                                return Flux.error(
                                        new AiServiceException(
                                                "Добавьте OPENROUTER_API_KEY в .env на сервере"));
                            }
                            if (characters > properties.maxInputChars()) {
                                return Flux.error(
                                        new AiServiceException(
                                                "Правила и история чата слишком длинные. Сократите"
                                                        + " документ или начните новый чат"));
                            }
                            var state = new StreamState(model.remoteId());
                            long started = System.nanoTime();
                            String endpoint =
                                    properties.openrouter().baseUrl().replaceAll("/+$", "")
                                            + "/chat/completions";
                            return client.post()
                                    .uri(endpoint)
                                    .headers(h -> h.setBearerAuth(properties.openrouter().apiKey()))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .accept(MediaType.TEXT_EVENT_STREAM)
                                    .bodyValue(
                                            Map.of(
                                                    "model",
                                                    model.remoteId(),
                                                    "messages",
                                                    context,
                                                    "stream",
                                                    true,
                                                    "max_tokens",
                                                    model.maxOutputTokens()))
                                    .retrieve()
                                    .bodyToFlux(
                                            new ParameterizedTypeReference<
                                                    ServerSentEvent<String>>() {})
                                    .timeout(
                                            Duration.ofSeconds(
                                                    properties.openrouter().timeoutSeconds()))
                                    .takeUntil(event -> "[DONE]".equals(event.data()))
                                    .<String>handle(
                                            (event, sink) -> {
                                                String data = event.data();
                                                if (data == null || data.isBlank())
                                                    return; // SSE keepalive comments.
                                                if (data.equals("[DONE]")) {
                                                    state.done = true;
                                                    return;
                                                }
                                                try {
                                                    JsonNode chunk = json.readTree(data);
                                                    if (chunk.has("error")
                                                            || "error"
                                                                    .equals(
                                                                            chunk.path("choices")
                                                                                    .path(0)
                                                                                    .path(
                                                                                            "finish_reason")
                                                                                    .asText())) {
                                                        throw new AiServiceException(
                                                                "Модель прервала ответ. Попробуйте"
                                                                    + " ещё раз или выберите другую"
                                                                    + " модель");
                                                    }
                                                    if (chunk.path("model").isTextual())
                                                        state.remoteModel =
                                                                chunk.path("model").asText();
                                                    if (chunk.path("provider").isTextual())
                                                        state.provider =
                                                                chunk.path("provider").asText();
                                                    JsonNode usage = chunk.path("usage");
                                                    if (usage.path("prompt_tokens").isNumber())
                                                        state.inputTokens =
                                                                usage.path("prompt_tokens").asInt();
                                                    if (usage.path("completion_tokens").isNumber())
                                                        state.outputTokens =
                                                                usage.path("completion_tokens")
                                                                        .asInt();
                                                    String text =
                                                            chunk.path("choices")
                                                                    .path(0)
                                                                    .path("delta")
                                                                    .path("content")
                                                                    .asText("");
                                                    if (!text.isEmpty()) {
                                                        state.text.append(text);
                                                        sink.next(text);
                                                    }
                                                } catch (AiServiceException e) {
                                                    sink.error(e);
                                                } catch (Exception e) {
                                                    sink.error(
                                                            new AiServiceException(
                                                                    "Некорректный поток ответа от"
                                                                            + " ИИ-сервиса"));
                                                }
                                            })
                                    .take(Duration.ofSeconds(240))
                                    .concatWith(
                                            Flux.defer(
                                                    () -> {
                                                        if (!state.done || state.text.isEmpty()) {
                                                            return Flux.error(
                                                                    new AiServiceException(
                                                                            "Ответ модели оборвался"
                                                                                + " или оказался"
                                                                                + " пустым."
                                                                                + " Повторите"
                                                                                + " запрос"));
                                                        }
                                                        onComplete.accept(
                                                                new GenerationResult(
                                                                        state.text.toString(),
                                                                        model.id(),
                                                                        state.remoteModel,
                                                                        state.provider,
                                                                        state.inputTokens,
                                                                        state.outputTokens,
                                                                        Duration.ofNanos(
                                                                                        System
                                                                                                        .nanoTime()
                                                                                                - started)
                                                                                .toMillis()));
                                                        return Flux.empty();
                                                    }));
                        })
                .onErrorMap(
                        error -> {
                            if (error instanceof AiServiceException) return error;
                            if (error instanceof TimeoutException)
                                return new AiServiceException(
                                        "Модель слишком долго не отвечает. Повторите запрос");
                            if (error instanceof WebClientResponseException response) {
                                return new AiServiceException(
                                        switch (response.getStatusCode().value()) {
                                            case 401, 403 ->
                                                    "OpenRouter отклонил API-ключ. Проверьте"
                                                            + " настройки сервера";
                                            case 402 ->
                                                    "Недостаточно средств на аккаунте OpenRouter";
                                            case 429 ->
                                                    "Превышен лимит запросов OpenRouter. Попробуйте"
                                                            + " позже";
                                            default ->
                                                    "OpenRouter временно недоступен. Попробуйте"
                                                            + " позже";
                                        });
                            }
                            return new AiServiceException(
                                    "Не удалось получить или сохранить ответ модели. Попробуйте"
                                            + " позже");
                        });
    }

    private volatile List<CatalogOption> cachedCatalog;
    private volatile long catalogExpires;

    public synchronized List<CatalogOption> catalog() {
        if (cachedCatalog != null && System.currentTimeMillis() < catalogExpires)
            return cachedCatalog;
        try {
            JsonNode result =
                    client.get()
                            .uri(
                                    properties.openrouter().baseUrl().replaceAll("/+$", "")
                                            + "/models")
                            .retrieve()
                            .bodyToMono(JsonNode.class)
                            .block(Duration.ofSeconds(20));
            if (result == null || !result.path("data").isArray())
                throw new AiServiceException("Некорректный каталог OpenRouter");
            var options = new java.util.ArrayList<CatalogOption>();
            for (JsonNode model : result.path("data")) {
                if (!model.path("id").isTextual() || !model.path("name").isTextual()) continue;
                options.add(
                        new CatalogOption(
                                model.path("id").asText(),
                                model.path("name").asText(),
                                model.path("top_provider")
                                                .path("max_completion_tokens")
                                                .canConvertToInt()
                                        ? model.path("top_provider")
                                                .path("max_completion_tokens")
                                                .asInt()
                                        : 32768,
                                pricePerMillion(model.path("pricing").path("prompt")),
                                pricePerMillion(model.path("pricing").path("completion"))));
            }
            cachedCatalog = List.copyOf(options);
            catalogExpires = System.currentTimeMillis() + 3600000;
            return cachedCatalog;
        } catch (AiServiceException error) {
            throw error;
        } catch (Exception error) {
            throw new AiServiceException(
                    "Не удалось загрузить каталог OpenRouter. Попробуйте позже");
        }
    }

    public String recognizePdf(byte[] bytes, String remoteModel) {
        if (properties.openrouter().apiKey().isBlank())
            throw new AiServiceException(
                    "Для распознавания сканов добавьте OPENROUTER_API_KEY на сервере");
        var file =
                Map.of(
                        "type",
                        "file",
                        "file",
                        Map.of(
                                "filename",
                                "rules.pdf",
                                "file_data",
                                "data:application/pdf;base64,"
                                        + java.util.Base64.getEncoder().encodeToString(bytes)));
        var body =
                Map.of(
                        "model",
                        remoteModel,
                        "stream",
                        false,
                        "max_tokens",
                        128,
                        "messages",
                        List.of(
                                Map.of(
                                        "role",
                                        "user",
                                        "content",
                                        List.of(
                                                Map.of(
                                                        "type",
                                                        "text",
                                                        "text",
                                                        "Parse the attached rulebook. Reply OK."),
                                                file))),
                        "plugins",
                        List.of(
                                Map.of(
                                        "id",
                                        "file-parser",
                                        "pdf",
                                        Map.of("engine", "mistral-ocr"))));
        try {
            JsonNode result =
                    client.post()
                            .uri(
                                    properties.openrouter().baseUrl().replaceAll("/+$", "")
                                            + "/chat/completions")
                            .headers(h -> h.setBearerAuth(properties.openrouter().apiKey()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToMono(JsonNode.class)
                            .block(Duration.ofSeconds(240));
            StringBuilder markdown = new StringBuilder();
            if (result != null)
                for (JsonNode annotation :
                        result.path("choices").path(0).path("message").path("annotations")) {
                    if (!annotation.path("type").asText().equals("file")) continue;
                    for (JsonNode part : annotation.path("file").path("content"))
                        if (part.path("type").asText().equals("text"))
                            markdown.append(part.path("text").asText()).append("\n\n");
                }
            if (markdown.toString().isBlank())
                throw new AiServiceException(
                        "OCR не смог распознать текст правил. Загрузите более чёткий скан");
            if (markdown.length() > properties.maxInputChars())
                throw new AiServiceException("Распознанные правила превышают допустимый размер");
            return markdown.toString();
        } catch (AiServiceException error) {
            throw error;
        } catch (Exception error) {
            throw new AiServiceException(
                    "Не удалось распознать PDF через OpenRouter. Проверьте ключ, баланс и"
                            + " доступность сервиса");
        }
    }

    private static java.math.BigDecimal pricePerMillion(JsonNode value) {
        if (!value.isTextual() && !value.isNumber()) return null;
        try {
            var price = new java.math.BigDecimal(value.asText());
            return price.signum() < 0 ? null : price.multiply(java.math.BigDecimal.valueOf(1000000));
        } catch (NumberFormatException error) {
            return null;
        }
    }

    public record CatalogOption(
            String id,
            String name,
            int maxOutputTokens,
            java.math.BigDecimal inputPricePerMillion,
            java.math.BigDecimal outputPricePerMillion) {}

    private static class StreamState {
        final StringBuilder text = new StringBuilder();
        String remoteModel;
        String provider;
        Integer inputTokens;
        Integer outputTokens;
        boolean done;

        StreamState(String remoteModel) {
            this.remoteModel = remoteModel;
        }
    }
}
