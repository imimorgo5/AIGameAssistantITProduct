package ru.project.gameAssistantBackend.dto.chat;

import java.time.Instant;

public record ChatPreviewDTO(
        Long id,
        Long gameId,
        String title,
        Instant lastUseTime
) {
}
