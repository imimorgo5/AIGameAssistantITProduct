package ru.project.gameAssistantBackend.controllers;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;

import reactor.core.publisher.Flux;

import ru.project.gameAssistantBackend.ai.*;
import ru.project.gameAssistantBackend.models.*;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;
import ru.project.gameAssistantBackend.service.impl.SystemPropertiesServiceImpl;

import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/guest")
public class GuestController {
    private final GuestQuotaService quotas;
    private final ModelCatalog catalog;
    private final OpenRouterClient router;
    private final RulesService rules;
    private final GameServiceImpl games;
    private final SystemPropertiesServiceImpl settings;
    private final String publicUrl;
    private final String ipHeader;

    public GuestController(
            GuestQuotaService quotas,
            ModelCatalog catalog,
            OpenRouterClient router,
            RulesService rules,
            GameServiceImpl games,
            SystemPropertiesServiceImpl settings,
            @Value("${app.public-url}") String publicUrl,
            @Value("${ai.guest.client-ip-header:}") String ipHeader) {
        this.quotas = quotas;
        this.catalog = catalog;
        this.router = router;
        this.rules = rules;
        this.games = games;
        this.settings = settings;
        this.publicUrl = publicUrl;
        this.ipHeader = ipHeader;
    }

    private String identity(HttpServletRequest request, HttpServletResponse response) {
        String id = null;
        if (request.getCookies() != null)
            for (Cookie cookie : request.getCookies())
                if (cookie.getName().equals("ga_guest")
                        && cookie.getValue().matches("[a-f0-9-]{36}")) id = cookie.getValue();
        if (id == null) id = UUID.randomUUID().toString();
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                ResponseCookie.from("ga_guest", id)
                        .httpOnly(true)
                        .secure(publicUrl.startsWith("https:"))
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(Duration.ofDays(1))
                        .build()
                        .toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return id;
    }

    private String address(HttpServletRequest request) {
        return ipHeader.isBlank() ? null : request.getHeader(ipHeader);
    }

    @GetMapping("/status")
    public Status status(
            HttpServletRequest request, HttpServletResponse response) {
        var quota = quotas.quota(identity(request, response), address(request), false);
        return new Status(quota.remaining(), quota.limit(), quota.resetsAt(), catalog.defaultId());
    }

    public record Status(int remaining, int limit, java.time.Instant resetsAt, String modelId) {}

    @PostMapping(value = "/answer", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> answer(
            @Valid @RequestBody Question input,
            HttpServletRequest request,
            HttpServletResponse response)
            throws Exception {
        String id = identity(request, response);
        var game = games.getGameById(input.gameId());
        String markdown = rules.markdown(game.getRulesFileTitle());
        var selected = catalog.resolve(null, catalog.defaultId());
        var model =
                new AiProperties.Model(
                        selected.id(),
                        selected.name(),
                        selected.remoteId(),
                        true,
                        Math.min(2048, selected.maxOutputTokens()));
        var messages = new ArrayList<Message>();
        messages.add(
                message(
                        ChatRole.system,
                        settings.getPromptText()
                                + "\n\n"
                                + AnswerPrompt.FORMAT
                                + "\n\nИгра: "
                                + game.getTitle()
                                + "\n<game-rules>\n"
                                + markdown
                                + "\n</game-rules>"));
        int total = 0;
        for (var previous : input.history()) {
            if (!Set.of("user", "assistant").contains(previous.role())
                    || previous.text().isBlank()
                    || previous.text().length() > (previous.role().equals("user") ? 1000 : 15000))
                throw new IllegalArgumentException("Некорректная история гостевого чата");
            total += previous.text().length();
            messages.add(message(ChatRole.valueOf(previous.role()), previous.text()));
        }
        if (total > 60000) throw new IllegalArgumentException("История слишком длинная");
        messages.add(message(ChatRole.user, input.prompt()));
        quotas.quota(id, address(request), true);
        return router.stream(model, messages, result -> {})
                .map(text -> ServerSentEvent.builder(text).build())
                .concatWithValues(ServerSentEvent.builder("ok").event("done").build())
                .onErrorResume(
                        error ->
                                Flux.just(
                                        ServerSentEvent.builder(error.getMessage())
                                                .event("error")
                                                .build()));
    }

    private Message message(ChatRole role, String text) {
        var message = new Message();
        message.setRole(role);
        message.setText(text);
        return message;
    }

    public record Question(
            @NotNull @Positive Long gameId,
            @NotBlank @Size(max = 1000) String prompt,
            @NotNull @Size(max = 8) List<@Valid Previous> history) {}

    public record Previous(@NotNull String role, @NotNull @Size(max = 15000) String text) {}
}
