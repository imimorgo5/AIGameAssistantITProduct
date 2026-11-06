package ru.project.gameAssistantBackend.dto.chat;

public record StartChatDTO(
        Long gameId,
        String request
) {
}
