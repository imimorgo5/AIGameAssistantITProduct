package ru.project.gameAssistantBackend.dto;

public record ResetPasswordDTO(
        @jakarta.validation.constraints.NotBlank String token,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 4, max = 72) String password
) {
}
