package ru.project.gameAssistantBackend.dto.jwt;

public record JwtRequest(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email @jakarta.validation.constraints.Size(max = 100) String email,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 72) String password
) {
}
