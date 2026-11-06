package ru.project.gameAssistantBackend.dto.chat;

import java.time.Instant;
import java.util.List;

public record ChatDTO(
        Long id,
        String title,
        Instant lastUseTime,
        List<MessageDTO> messageDTOs
) {
}
