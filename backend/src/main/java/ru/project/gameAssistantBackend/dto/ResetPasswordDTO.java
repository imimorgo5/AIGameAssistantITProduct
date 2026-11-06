package ru.project.gameAssistantBackend.dto;

public record ResetPasswordDTO(
        String token,
        String password
) {
}
