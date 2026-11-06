package ru.project.gameAssistantBackend.dto.user;

import org.springframework.web.multipart.MultipartFile;

public record UserRequestDTO(
        String email,
        String login,
        String password,
        MultipartFile imageFile
) {
}
