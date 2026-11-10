package ru.project.gameAssistantBackend.ai;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import ru.project.gameAssistantBackend.service.impl.FileServiceImpl;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
public class RulesService {
    private final JdbcTemplate db;
    private final TransactionTemplate transactions;
    private final FileServiceImpl files;
    private final OpenRouterClient router;
    private final ModelCatalog catalog;

    public RulesService(
            JdbcTemplate db,
            TransactionTemplate transactions,
            FileServiceImpl files,
            OpenRouterClient router,
            ModelCatalog catalog) {
        this.db = db;
        this.transactions = transactions;
        this.files = files;
        this.router = router;
        this.catalog = catalog;
    }

    public void enqueue(String title) {
        if (title == null || !title.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf"))
            throw new IllegalArgumentException("Загрузите правила в формате PDF");
        db.update(
                "INSERT INTO rule_document (file_title,status,updated_at) VALUES"
                    + " (?,'pending',CURRENT_TIMESTAMP) ON CONFLICT (file_title) DO NOTHING",
                title);
    }

    public Map<String, Object> status(String title) {
        if (title == null) return Map.of("status", "missing", "error", "");
        return db.queryForObject(
                "SELECT status,error FROM rule_document WHERE file_title=?",
                (rs, row) ->
                        Map.of(
                                "status",
                                rs.getString(1),
                                "error",
                                rs.getString(2) == null ? "" : rs.getString(2)),
                title);
    }

    public void retry(String title) {
        enqueue(title);
        db.update(
                "UPDATE rule_document SET status='pending', error=NULL,"
                    + " updated_at=CURRENT_TIMESTAMP WHERE file_title=? AND status='failed'",
                title);
    }

    public String markdown(String title) {
        var state = status(title);
        if (!state.get("status").equals("ready"))
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    state.get("status").equals("failed")
                            ? String.valueOf(state.get("error"))
                            : "Правила ещё обрабатываются. Попробуйте через несколько секунд");
        return files.extractTextFromMarkdown(title);
    }

    @Scheduled(
            fixedDelayString = "${ai.rules.poll-ms:3000}",
            initialDelayString = "${ai.rules.initial-delay-ms:1000}")
    public void processNext() {
        String title =
                transactions.execute(
                        tx -> {
                            var jobs =
                                    db.query(
                                            "SELECT file_title FROM rule_document WHERE"
                                                + " status='pending' OR (status='processing' AND"
                                                + " updated_at < ?) ORDER BY updated_at LIMIT 1 FOR"
                                                + " UPDATE SKIP LOCKED",
                                            (rs, row) -> rs.getString(1),
                                            java.sql.Timestamp.from(
                                                    Instant.now().minusSeconds(600)));
                            if (jobs.isEmpty()) return null;
                            String selected = jobs.getFirst();
                            db.update(
                                    "UPDATE rule_document SET"
                                        + " status='processing',updated_at=CURRENT_TIMESTAMP,attempts=attempts+1"
                                        + " WHERE file_title=?",
                                    selected);
                            return selected;
                        });
        if (title == null) return;
        try {
            Path source = files.resolveFile(title);
            if (Files.size(source) > 10 * 1024 * 1024)
                throw new IllegalArgumentException("Максимальный размер PDF — 10 МБ");
            byte[] bytes = Files.readAllBytes(source);
            String hash =
                    HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            Path cached = files.resolveFile("rules-cache-" + hash + ".md");
            String markdown;
            if (Files.isRegularFile(cached)) markdown = Files.readString(cached);
            else {
                markdown = extract(bytes);
                atomicWrite(cached, markdown);
            }
            atomicWrite(files.resolveFile(title.replaceFirst("(?i)\\.pdf$", ".md")), markdown);
            db.update(
                    "UPDATE rule_document SET"
                        + " status='ready',error=NULL,content_hash=?,updated_at=CURRENT_TIMESTAMP"
                        + " WHERE file_title=?",
                    hash,
                    title);
        } catch (Exception error) {
            String message =
                    error instanceof IllegalArgumentException || error instanceof AiServiceException
                            ? error.getMessage()
                            : "Не удалось подготовить правила. Проверьте PDF и повторите обработку";
            db.update(
                    "UPDATE rule_document SET status='failed',error=?,updated_at=CURRENT_TIMESTAMP"
                        + " WHERE file_title=?",
                    message.substring(0, Math.min(message.length(), 1000)),
                    title);
        }
    }

    String extract(byte[] bytes) throws Exception {
        boolean scanned = false;
        StringBuilder text = new StringBuilder();
        try (PDDocument document = PDDocument.load(bytes)) {
            if (document.isEncrypted()) throw new IllegalArgumentException("PDF защищён паролем");
            if (document.getNumberOfPages() > 100)
                throw new IllegalArgumentException("Максимум 100 страниц в правилах");
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String content = stripper.getText(document).strip();
                if (content.replaceAll("\\s", "").length() < 80) scanned = true;
                text.append("## Страница ")
                        .append(page)
                        .append("\n\n")
                        .append(content)
                        .append("\n\n");
            }
        }
        String result =
                scanned
                        ? router.recognizePdf(
                                bytes, catalog.resolve(null, catalog.defaultId()).remoteId())
                        : text.toString();
        if (result.isBlank() || result.length() > 200000)
            throw new IllegalArgumentException(
                    "Правила пустые или превышают лимит 200000 символов");
        return result;
    }

    private void atomicWrite(Path target, String text) throws Exception {
        Path temporary = Files.createTempFile(files.getUploadPath(), "rules-", ".tmp");
        try {
            Files.writeString(temporary, text, StandardCharsets.UTF_8);
            Files.move(
                    temporary,
                    target,
                    StandardCopyOption.REPLACE_EXISTING,
                    StandardCopyOption.ATOMIC_MOVE);
        } finally {
            Files.deleteIfExists(temporary);
        }
    }
}
