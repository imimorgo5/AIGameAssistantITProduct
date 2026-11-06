package ru.project.gameAssistantBackend.dto.category;

public record CategoryResponseDTO(
        Long id,
        String name,
        Long gamesCount
) {
}
