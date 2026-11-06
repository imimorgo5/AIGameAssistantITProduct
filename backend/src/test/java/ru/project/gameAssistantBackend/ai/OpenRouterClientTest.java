package ru.project.gameAssistantBackend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import ru.project.gameAssistantBackend.models.ChatRole;
import ru.project.gameAssistantBackend.models.Message;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class OpenRouterClientTest {
    private HttpServer server;
    private final ObjectMapper json = new ObjectMapper();
    private final AtomicReference<JsonNode> request = new AtomicReference<>();
    private final AtomicReference<String> authorization = new AtomicReference<>();
    private final AtomicReference<GenerationResult> saved = new AtomicReference<>();
    private final AiProperties.Model model = new AiProperties.Model("fast", "Fast", "vendor/fast", true, 1234);

    private OpenRouterClient client(String response, String key) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/chat/completions", exchange -> {
            request.set(json.readTree(exchange.getRequestBody()));
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        var config = new AiProperties("fast", List.of(model),
                new AiProperties.OpenRouter(key, "http://127.0.0.1:" + server.getAddress().getPort() + "/api/v1", 5), 200000);
        return new OpenRouterClient(WebClient.create(), config, json);
    }

    private List<Message> messages() {
        Message message = new Message();
        message.setRole(ChatRole.user);
        message.setText("Rules question");
        return List.of(message);
    }

    @AfterEach void stop() { if (server != null) server.stop(0); }

    @Test void streamsTextAndRecordsActualModelAndUsage() throws Exception {
        String body = ": keepalive\n\n"
                + "data: {\"model\":\"vendor/actual\",\"provider\":\"Provider\",\"choices\":[{\"delta\":{\"content\":\"Roll \"}}]}\n\n"
                + "data: {\"choices\":[{\"delta\":{\"content\":\"one die.\"},\"finish_reason\":\"stop\"}]}\n\n"
                + "data: {\"usage\":{\"prompt_tokens\":12,\"completion_tokens\":5},\"choices\":[]}\n\n"
                + "data: [DONE]\n\n";
        var chunks = client(body, "test-key").stream(model, messages(), saved::set).collectList().block(Duration.ofSeconds(10));
        assertEquals(List.of("Roll ", "one die."), chunks);
        assertEquals("Bearer test-key", authorization.get());
        assertEquals("vendor/fast", request.get().path("model").asText());
        assertEquals(1234, request.get().path("max_tokens").asInt());
        assertEquals("Rules question", request.get().path("messages").path(0).path("content").asText());
        assertEquals("Roll one die.", saved.get().text());
        assertEquals("vendor/actual", saved.get().remoteModel());
        assertEquals(12, saved.get().inputTokens());
        assertEquals(5, saved.get().outputTokens());
    }

    @Test void rejectsMidstreamErrorWithoutSavingPartialAnswer() throws Exception {
        var client = client("data: {\"choices\":[{\"delta\":{\"content\":\"Partial\"}}]}\n\n"
                + "data: {\"error\":{\"message\":\"Private upstream error\"}}\n\n", "test-key");
        assertThrows(AiServiceException.class, () -> client.stream(model, messages(), saved::set).blockLast(Duration.ofSeconds(10)));
        assertNull(saved.get());
    }

    @Test void rejectsTruncatedStreamWithoutDoneMarker() throws Exception {
        var client = client("data: {\"choices\":[{\"delta\":{\"content\":\"Partial\"}}]}\n\n", "test-key");
        assertThrows(AiServiceException.class, () -> client.stream(model, messages(), saved::set).blockLast(Duration.ofSeconds(10)));
        assertNull(saved.get());
    }

    @Test void missingKeyDoesNotSendRequest() throws Exception {
        var client = client("", "");
        assertThrows(AiServiceException.class, () -> client.stream(model, messages(), saved::set).blockLast());
        assertNull(request.get());
    }
}
