package ru.project.gameAssistantBackend.dto;

import java.util.List;

public record PagedResponseDTO<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
}
