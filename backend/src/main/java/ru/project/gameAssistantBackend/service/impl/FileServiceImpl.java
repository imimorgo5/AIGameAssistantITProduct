package ru.project.gameAssistantBackend.service.impl;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.project.gameAssistantBackend.service.FileServiceI;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileServiceImpl implements FileServiceI {

    public final String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";

    public FileServiceImpl() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Не удалось создать директорию для загрузки файлов", e);
        }
    }

    public Path getUploadPath() {
        return Path.of(uploadDir);
    }

    @Override
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Files.createDirectories(Paths.get(uploadDir));
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File targetFile = new File(uploadDir, fileName);
            file.transferTo(targetFile);
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при сохранении файла", e);
        }
    }

    @Override
    public void delete(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }
        try {
            Path filePath = Paths.get(uploadDir, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при удалении файла", e);
        }
    }

    @Override
    public Resource getFileResource(String fileTitle) throws MalformedURLException {
        Path path = Paths.get(String.format("uploads/%s", fileTitle));
        return new UrlResource(path.toUri());
    }

    @Override
    public String extractTextFromMarkdown(String fileTitle) {
        String real = fileTitle.replaceFirst("(?i)\\.pdf$", ".md");
        try {
            return Files.readString(Paths.get(uploadDir, real), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Ошибка чтения файла: " + real, e);
        }
    }
}
