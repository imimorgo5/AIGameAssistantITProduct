package ru.project.gameAssistantBackend.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileServiceImplTest {
    @TempDir Path root;

    @Test
    void rejectsTraversalAbsolutePathsAndSymlinksForEveryFileOperation() throws Exception {
        FileServiceImpl files = new FileServiceImpl(root.resolve("uploads"));
        for (String name : new String[] { "../secret", "/tmp/secret", "..\\secret", ".", ".." }) {
            assertThrows(IllegalArgumentException.class, () -> files.getFileResource(name));
            assertThrows(IllegalArgumentException.class, () -> files.delete(name));
            assertThrows(IllegalArgumentException.class, () -> files.extractTextFromMarkdown(name));
            assertThrows(IllegalArgumentException.class, () -> files.save(new MockMultipartFile("file", name, "application/pdf", new byte[] {1})));
        }
        Path secret = Files.writeString(root.resolve("secret"), "private");
        Files.createSymbolicLink(files.getUploadPath().resolve("link"), secret);
        assertThrows(IllegalArgumentException.class, () -> files.getFileResource("link"));
        assertEquals("private", Files.readString(secret));
    }

    @Test
    void storesUniqueFilesAndReturns404ForMissingResources() throws Exception {
        FileServiceImpl files = new FileServiceImpl(root);
        MockMultipartFile upload = new MockMultipartFile("file", "rules.pdf", "application/pdf", new byte[] {1, 2});
        String first = files.save(upload);
        String second = files.save(upload);
        assertNotEquals(first, second);
        assertTrue(files.getFileResource(first).exists());
        files.delete(first);
        assertThrows(ResponseStatusException.class, () -> files.getFileResource(first));
        assertTrue(files.getFileResource(second).exists());
    }
}
