package ru.project.gameAssistantBackend.dto.game;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record GameRequestDTO(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100) String title,
        @jakarta.validation.constraints.Size(max = 100000) String description,
        @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Size(max = 50) List<@jakarta.validation.constraints.NotBlank String> categories,
        MultipartFile imageFile,
        MultipartFile rulesFile
) {
}
