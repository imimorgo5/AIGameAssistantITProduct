package ru.project.gameAssistantBackend.service.impl;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.project.gameAssistantBackend.service.FileServiceI;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileServiceI {
    private final Path uploadPath;

    public FileServiceImpl() { this(Path.of(System.getProperty("user.dir"), "uploads")); }

    FileServiceImpl(Path directory) {
        uploadPath = directory.toAbsolutePath().normalize();
        try { Files.createDirectories(uploadPath); }
        catch (IOException error) { throw new IllegalStateException("Не удалось создать директорию загрузок", error); }
    }

    public Path getUploadPath() { return uploadPath; }

    public Path resolveFile(String name) {
        if (name == null || name.isBlank() || name.equals(".") || name.equals("..") || name.contains("/") || name.contains("\\") || name.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Некорректное имя файла");
        }
        Path path = uploadPath.resolve(name).normalize();
        if (!path.getParent().equals(uploadPath) || Files.isSymbolicLink(path)) throw new IllegalArgumentException("Некорректное имя файла");
        return path;
    }

    @Override
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        String original = file.getOriginalFilename();
        resolveFile(original);
        String name = UUID.randomUUID() + "_" + original;
        try { file.transferTo(resolveFile(name)); return name; }
        catch (IOException error) { throw new IllegalStateException("Ошибка при сохранении файла", error); }
    }

    @Override
    public void delete(String name) {
        if (name == null || name.isEmpty()) return;
        try { Files.deleteIfExists(resolveFile(name)); }
        catch (IOException error) { throw new IllegalStateException("Ошибка при удалении файла", error); }
    }

    @Override
    public Resource getFileResource(String name) throws MalformedURLException {
        Path path = resolveFile(name);
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не найден");
        return new UrlResource(path.toUri());
    }

    @Override
    public String extractTextFromMarkdown(String name) {
        resolveFile(name);
        String markdown = name.replaceFirst("(?i)\\.pdf$", ".md");
        try { return Files.readString(resolveFile(markdown), StandardCharsets.UTF_8); }
        catch (IOException error) { throw new IllegalStateException("Не удалось прочитать правила игры", error); }
    }
}
