package ru.project.gameAssistantBackend.service.impl;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ConverterTest {
    @TempDir Path uploads;

    private Converter converter() {
        FileServiceImpl files = mock(FileServiceImpl.class);
        when(files.getUploadPath()).thenReturn(uploads);
        return new Converter(files);
    }

    @Test
    void preservesShortRulesAndPageReferences() throws Exception {
        try (PDDocument pdf = new PDDocument()) {
            PDPage page = new PDPage();
            pdf.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(pdf, page)) {
                content.beginText();
                content.setFont(PDType1Font.HELVETICA, 12);
                content.newLineAtOffset(72, 720);
                content.showText("Roll one die on your turn.");
                content.endText();
            }
            pdf.save(uploads.resolve("rules.pdf").toFile());
        }
        converter().pdfToMd("rules.pdf");
        String text = Files.readString(uploads.resolve("rules.md"));
        assertTrue(text.contains("## Страница 1"));
        assertTrue(text.contains("Roll one die on your turn."));
        assertFalse(text.contains("Evaluation"));
    }

    @Test
    void rejectsDocumentsWithoutText() throws Exception {
        try (PDDocument pdf = new PDDocument()) {
            pdf.addPage(new PDPage());
            pdf.save(uploads.resolve("empty.pdf").toFile());
        }
        assertThrows(IllegalArgumentException.class, () -> converter().pdfToMd("empty.pdf"));
        assertFalse(Files.exists(uploads.resolve("empty.md")));
    }
}
