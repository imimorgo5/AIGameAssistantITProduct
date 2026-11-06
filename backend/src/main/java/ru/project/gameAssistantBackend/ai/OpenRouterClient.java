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

    public OpenRouterClient(@Qualifier("openRouterWebClient") WebClient client, AiProperties properties, ObjectMapper json) {
        this.client = client;
        this.properties = properties;
        this.json = json;
    }

    public Flux<String> stream(AiProperties.Model model, List<Message> messages, Consumer<GenerationResult> onComplete) {
        // Copy JPA entities while the request's persistence context is still open.
        var context = messages.stream()
                .map(m -> Map.of("role", m.getRole().name(), "content", m.getText())).toList();
        long characters = messages.stream().mapToLong(m -> m.getText().length()).sum();
        return Flux.defer(() -> {
            if (properties.openrouter().apiKey().isBlank()) {
                return Flux.error(new AiServiceException("Добавьте OPENROUTER_API_KEY в .env на сервере"));
            }
            if (characters > properties.maxInputChars()) {
                return Flux.error(new AiServiceException("Правила и история чата слишком длинные. Сократите документ или начните новый чат"));
            }
            var state = new StreamState(model.remoteId());
            long started = System.nanoTime();
            String endpoint = properties.openrouter().baseUrl().replaceAll("/+$", "") + "/chat/completions";
            return client.post().uri(endpoint)
                    .headers(h -> h.setBearerAuth(properties.openrouter().apiKey()))
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.TEXT_EVENT_STREAM)
                    .bodyValue(Map.of("model", model.remoteId(), "messages", context,
                            "stream", true, "max_tokens", model.maxOutputTokens()))
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                    .timeout(Duration.ofSeconds(properties.openrouter().timeoutSeconds()))
                    .takeUntil(event -> "[DONE]".equals(event.data()))
                    .<String>handle((event, sink) -> {
                        String data = event.data();
                        if (data == null || data.isBlank()) return; // SSE keepalive comments.
                        if (data.equals("[DONE]")) { state.done = true; return; }
                        try {
                            JsonNode chunk = json.readTree(data);
                            if (chunk.has("error") || "error".equals(chunk.path("choices").path(0).path("finish_reason").asText())) {
                                throw new AiServiceException("Модель прервала ответ. Попробуйте ещё раз или выберите другую модель");
                            }
                            if (chunk.path("model").isTextual()) state.remoteModel = chunk.path("model").asText();
                            if (chunk.path("provider").isTextual()) state.provider = chunk.path("provider").asText();
                            JsonNode usage = chunk.path("usage");
                            if (usage.path("prompt_tokens").isNumber()) state.inputTokens = usage.path("prompt_tokens").asInt();
                            if (usage.path("completion_tokens").isNumber()) state.outputTokens = usage.path("completion_tokens").asInt();
                            String text = chunk.path("choices").path(0).path("delta").path("content").asText("");
                            if (!text.isEmpty()) { state.text.append(text); sink.next(text); }
                        } catch (AiServiceException e) {
                            sink.error(e);
                        } catch (Exception e) {
                            sink.error(new AiServiceException("Некорректный поток ответа от ИИ-сервиса"));
                        }
                    })
                    .concatWith(Flux.defer(() -> {
                        if (!state.done || state.text.isEmpty()) {
                            return Flux.error(new AiServiceException("Ответ модели оборвался или оказался пустым. Повторите запрос"));
                        }
                        onComplete.accept(new GenerationResult(state.text.toString(), model.id(), state.remoteModel,
                                state.provider, state.inputTokens, state.outputTokens,
                                Duration.ofNanos(System.nanoTime() - started).toMillis()));
                        return Flux.empty();
                    }));
        }).onErrorMap(error -> {
            if (error instanceof AiServiceException) return error;
            if (error instanceof TimeoutException) return new AiServiceException("Модель слишком долго не отвечает. Повторите запрос");
            if (error instanceof WebClientResponseException response) {
                return new AiServiceException(switch (response.getStatusCode().value()) {
                    case 401, 403 -> "OpenRouter отклонил API-ключ. Проверьте настройки сервера";
                    case 402 -> "Недостаточно средств на аккаунте OpenRouter";
                    case 429 -> "Превышен лимит запросов OpenRouter. Попробуйте позже";
                    default -> "OpenRouter временно недоступен. Попробуйте позже";
                });
            }
            return new AiServiceException("Не удалось получить или сохранить ответ модели. Попробуйте позже");
        });
    }

    private static class StreamState {
        final StringBuilder text = new StringBuilder();
        String remoteModel;
        String provider;
        Integer inputTokens;
        Integer outputTokens;
        boolean done;
        StreamState(String remoteModel) { this.remoteModel = remoteModel; }
    }
}
