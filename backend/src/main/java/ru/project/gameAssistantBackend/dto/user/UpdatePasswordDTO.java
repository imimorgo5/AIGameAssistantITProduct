package ru.project.gameAssistantBackend.dto.user;

public record UpdatePasswordDTO(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 4, max = 72) String newPassword) {
}
