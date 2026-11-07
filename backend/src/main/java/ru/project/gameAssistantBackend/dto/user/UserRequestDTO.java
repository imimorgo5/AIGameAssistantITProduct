package ru.project.gameAssistantBackend.dto.user;

import org.springframework.web.multipart.MultipartFile;

public record UserRequestDTO(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email @jakarta.validation.constraints.Size(max = 100) String email,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 50) String login,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 4, max = 72) String password,
        MultipartFile imageFile
) {
}
