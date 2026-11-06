package ru.project.gameAssistantBackend.dto.jwt;

public record JwtRequest(
        String email,
        String password
) {
}
