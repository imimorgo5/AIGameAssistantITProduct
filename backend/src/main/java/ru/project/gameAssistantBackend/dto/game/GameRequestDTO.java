package ru.project.gameAssistantBackend.dto.game;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record GameRequestDTO(
        String title,
        String description,
        List<String> categories,
        MultipartFile imageFile,
        MultipartFile rulesFile
) {
}
