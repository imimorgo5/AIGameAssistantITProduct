package ru.project.gameAssistantBackend.dto.user;


public record UserResponseDTO(
        Long id,
        String email,
        String login,
        boolean isAdmin,
        String imageFileTitle,
        String model,
        boolean isEnabled
) {
}
