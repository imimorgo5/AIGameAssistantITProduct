package ru.project.gameAssistantBackend.dto.chat;

import ru.project.gameAssistantBackend.models.ChatRole;

import java.time.Instant;

public record MessageDTO(
        ChatRole role,
        String text,
        Instant timestamp,
        String modelId, String remoteModel, String provider,
        Integer inputTokens, Integer outputTokens, Long durationMs
) {
}
