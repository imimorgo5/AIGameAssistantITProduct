package ru.project.gameAssistantBackend.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import ru.project.gameAssistantBackend.service.impl.FileServiceImpl;

import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

@EnabledIfEnvironmentVariable(named = "ASSISTANT_TEST_POSTGRES_URL", matches = ".+")
@SpringBootTest(
        properties = {
            "spring.config.import=",
            "spring.jpa.hibernate.ddl-auto=none",
            "ai.rules.initial-delay-ms=3600000",
            "jwt.secret.access=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
            "jwt.secret.refresh=AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ==",
            "app.admin.email=",
            "app.admin.password="
        })
@AutoConfigureMockMvc
class AssistantPostgresTest {
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("ASSISTANT_TEST_POSTGRES_URL"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "assistant-test-password");
    }

    @Autowired JdbcTemplate db;
    @Autowired GuestQuotaService quotas;
    @Autowired ModelCatalog catalog;
    @Autowired RulesService rules;
    @Autowired MockMvc mvc;
    @MockitoBean OpenRouterClient router;
    @MockitoBean FileServiceImpl files;
    @TempDir Path uploads;

    @BeforeEach
    void setup() {
        chats.deleteAll();
        users.deleteAll();
        games.deleteAll();
        db.update("DELETE FROM guest_quota");
        db.update("DELETE FROM rule_document");
        when(files.resolveFile(anyString()))
                .thenAnswer(call -> uploads.resolve((String) call.getArgument(0)));
        when(files.getUploadPath()).thenReturn(uploads);
        when(router.catalog())
                .thenReturn(List.of(new OpenRouterClient.CatalogOption("test/one", "Test", 4096, null, null)));
        if (catalog.options().isEmpty()) catalog.add("test/one", "Test", 4096);
    }

    @Test
    void serializesConcurrentGuestRequestsAndEnforcesDailyLimit() throws Exception {
        String id = UUID.randomUUID().toString();
        try (var pool = Executors.newFixedThreadPool(2)) {
            var tasks = List.<Callable<Boolean>>of(() -> consume(id), () -> consume(id));
            long accepted = 0;
            for (var result : pool.invokeAll(tasks)) if (result.get()) accepted++;
            assertEquals(1, accepted);
        }
        for (int i = 0; i < 4; i++) {
            db.update(
                    "UPDATE guest_quota SET last_request=CURRENT_TIMESTAMP - INTERVAL '11 seconds'"
                            + " WHERE bucket=?",
                    "guest:" + id);
            quotas.quota(id, null, true);
        }
        assertEquals(0, quotas.quota(id, null, false).remaining());
        assertFalse(consume(id));
        assertEquals(0, db.queryForObject("SELECT COUNT(*) FROM message", Integer.class));
    }

    private boolean consume(String id) {
        try {
            quotas.quota(id, null, true);
            return true;
        } catch (org.springframework.web.server.ResponseStatusException error) {
            assertEquals(429, error.getStatusCode().value());
            return false;
        }
    }

    @Test
    void preparesTextAndScannedRulesAndReusesHashCache() throws Exception {
        createPdf("text.pdf", true);
        createPdf("scan.pdf", false);
        when(router.recognizePdf(any(), anyString()))
                .thenReturn(
                        "# Распознанные правила\n\n"
                                + "Игрок бросает кубик и передвигает фишку. ".repeat(5));
        rules.enqueue("text.pdf");
        rules.processNext();
        assertEquals("ready", rules.status("text.pdf").get("status"));
        assertTrue(Files.readString(uploads.resolve("text.md")).contains("## Страница 1"));
        verify(router, never()).recognizePdf(any(), anyString());
        rules.enqueue("scan.pdf");
        rules.processNext();
        assertEquals("ready", rules.status("scan.pdf").get("status"));
        Files.copy(uploads.resolve("scan.pdf"), uploads.resolve("copy.pdf"));
        rules.enqueue("copy.pdf");
        rules.processNext();
        verify(router, times(1)).recognizePdf(any(), anyString());
        assertEquals(
                Files.readString(uploads.resolve("scan.md")),
                Files.readString(uploads.resolve("copy.md")));
        Files.writeString(uploads.resolve("broken.pdf"), "broken");
        rules.enqueue("broken.pdf");
        rules.processNext();
        assertEquals("failed", rules.status("broken.pdf").get("status"));
        rules.retry("broken.pdf");
        assertEquals("pending", rules.status("broken.pdf").get("status"));
        db.update("DELETE FROM rule_document");
    }

    private void createPdf(String name, boolean text) throws Exception {
        try (var pdf = new PDDocument()) {
            var page = new PDPage();
            pdf.addPage(page);
            if (text)
                try (var content = new PDPageContentStream(pdf, page)) {
                    content.beginText();
                    content.setFont(PDType1Font.HELVETICA, 10);
                    content.newLineAtOffset(40, 740);
                    content.showText(
                            "The player rolls a die and moves their piece. A turn includes rolling"
                                    + " and moving. The player with most points wins.");
                    content.endText();
                }
            else
                try (var content = new PDPageContentStream(pdf, page)) {
                    content.addRect(40, 40, 200, 200);
                    content.fill();
                }
            pdf.save(uploads.resolve(name).toFile());
        }
    }

    @Test
    void protectsModelRegistryAndIssuesAnonymousCookie() throws Exception {
        mvc.perform(get("/api/models/registry")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/guest/status"))
                .andExpect(status().isOk())
                .andExpect(
                        header().string(
                                        "Set-Cookie",
                                        org.hamcrest.Matchers.containsString("HttpOnly")));
    }

    @Test
    @WithMockUser(authorities = "USER")
    void refusesModelMutationForRegularUser() throws Exception {
        mvc.perform(delete("/api/models/any")).andExpect(status().isForbidden());
    }

    @Autowired ru.project.gameAssistantBackend.repository.UserRepository users;
    @Autowired ru.project.gameAssistantBackend.repository.GameRepository games;
    @Autowired ru.project.gameAssistantBackend.repository.ChatRepository chats;

    @Test
    void continuesExistingChatAtTheSameIdAndBuildsTheCurrentPrompt() throws Exception {
        String email = "owner-" + UUID.randomUUID() + "@example.com";
        var owner =
                new ru.project.gameAssistantBackend.models.User(
                        email,
                        "owner-" + UUID.randomUUID(),
                        "encoded",
                        ru.project.gameAssistantBackend.models.Role.USER,
                        null);
        owner.setEnabled(true);
        owner = users.save(owner);
        var game = new ru.project.gameAssistantBackend.models.Game();
        game.setTitle("Shared");
        game.setRulesFileTitle("existing.pdf");
        game = games.save(game);
        db.update(
                "INSERT INTO rule_document(file_title,status,updated_at) VALUES"
                        + " ('existing.pdf','ready',CURRENT_TIMESTAMP) ON CONFLICT(file_title) DO"
                        + " UPDATE SET status='ready'");
        when(files.extractTextFromMarkdown("existing.pdf"))
                .thenReturn("## Страница 1\nПравила игры");
        var chat = new ru.project.gameAssistantBackend.models.Chat();
        chat.setUzer(owner);
        chat.setGame(game);
        chat.setTitle("Existing");
        chat.setLastUseTime(java.time.Instant.now());
        chat.addMessage(
                "Old system instruction", ru.project.gameAssistantBackend.models.ChatRole.system);
        chat.addMessage("Previous question", ru.project.gameAssistantBackend.models.ChatRole.user);
        chat = chats.save(chat);
        var authentication =
                new ru.project.gameAssistantBackend.jwt.JwtAuthentication(
                        email, ru.project.gameAssistantBackend.models.Role.USER);
        mvc.perform(
                        put("/api/chat/" + chat.getId())
                                .with(
                                        org.springframework.security.test.web.servlet.request
                                                .SecurityMockMvcRequestPostProcessors
                                                .authentication(authentication))
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content("{\"prompt\":\"New question\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(chat.getId()))
                .andExpect(jsonPath("$.messageDTOs.length()").value(2));
        when(router.stream(any(), anyList(), any()))
                .thenAnswer(
                        call -> {
                            List<ru.project.gameAssistantBackend.models.Message> context =
                                    call.getArgument(1);
                            assertTrue(context.getFirst().getText().contains("TL;DR"));
                            assertTrue(context.getFirst().getText().contains("## Страница 1"));
                            assertEquals(3, context.size());
                            java.util.function.Consumer<GenerationResult> complete =
                                    call.getArgument(2);
                            complete.accept(
                                    new GenerationResult(
                                            "TL;DR: Ответ", "test", "test/one", "Test", 10, 10, 1));
                            return reactor.core.publisher.Flux.just("TL;DR: Ответ");
                        });
        String exhausted = UUID.randomUUID().toString();
        db.update(
                "INSERT INTO guest_quota(bucket,quota_day,used,last_request) VALUES"
                        + " (?,?,5,CURRENT_TIMESTAMP)",
                "guest:" + exhausted,
                java.time.LocalDate.now(java.time.ZoneOffset.UTC));
        mvc.perform(
                        post("/api/guest/answer")
                                .cookie(new jakarta.servlet.http.Cookie("ga_guest", exhausted))
                                .accept(org.springframework.http.MediaType.TEXT_EVENT_STREAM)
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"gameId\":"
                                                + game.getId()
                                                + ",\"prompt\":\"Guest question\",\"history\":[]}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(
                        jsonPath("$.message")
                                .value(org.hamcrest.Matchers.containsString("лимит исчерпан")));
        var result =
                mvc.perform(
                                post("/api/chat/" + chat.getId() + "/answer")
                                        .with(
                                                org.springframework.security.test.web.servlet
                                                        .request
                                                        .SecurityMockMvcRequestPostProcessors
                                                        .authentication(authentication)))
                        .andExpect(
                                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                        .request()
                                        .asyncStarted())
                        .andReturn();
        mvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("event:done")));
        mvc.perform(
                        post("/api/chat/" + chat.getId() + "/answer")
                                .with(
                                        org.springframework.security.test.web.servlet.request
                                                .SecurityMockMvcRequestPostProcessors
                                                .authentication(authentication))
                                .accept(org.springframework.http.MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isConflict());
        assertNull(
                db.queryForObject(
                        "SELECT generation_until FROM chat WHERE id=?",
                        java.sql.Timestamp.class,
                        chat.getId()));
        assertEquals(1, chats.count());
        users.deleteById(owner.getId());
        games.deleteById(game.getId());
    }
}
