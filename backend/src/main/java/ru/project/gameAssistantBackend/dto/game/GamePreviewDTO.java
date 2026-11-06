package ru.project.gameAssistantBackend.dto.game;

import java.util.List;

public record GamePreviewDTO(
        Long id,
        String title,
        String description,
        List<String> categories,
        String imageFileTitle
) {
}
