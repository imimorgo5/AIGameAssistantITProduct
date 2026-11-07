package ru.project.gameAssistantBackend.service.impl;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

@Service
public class Converter {
    private final FileServiceImpl fileService;

    public Converter(FileServiceImpl fileService) {
        this.fileService = fileService;
    }

    public void pdfToMd(String fileName) {
        if (fileName == null || !fileName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new IllegalArgumentException("Загрузите правила в формате PDF");
        }
        Path pdf = fileService.resolveFile(fileName);
        Path markdown = pdf.resolveSibling(fileName.substring(0, fileName.length() - 4) + ".md");
        try (PDDocument document = PDDocument.load(pdf.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            StringBuilder content = new StringBuilder();
            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String text = stripper.getText(document).strip();
                if (!text.isBlank()) {
                    content.append("## Страница ").append(page).append("\n\n")
                            .append(text).append("\n\n");
                }
            }
            if (content.isEmpty()) {
                throw new IllegalArgumentException("PDF не содержит текста. Загрузите правила с текстовым слоем");
            }
            Files.writeString(markdown, content.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalArgumentException("Не удалось прочитать PDF с правилами", e);
        }
    }
}
