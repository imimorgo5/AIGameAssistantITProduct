package ru.project.gameAssistantBackend.dto.jwt;

public record JwtResponse(
        String accessToken,
        String refreshToken,
        String type
) {
    public JwtResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
