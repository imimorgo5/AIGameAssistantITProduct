package ru.project.gameAssistantBackend.dto.chat;

public record StartChatDTO(
        @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Positive Long gameId,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 10000) String request
) {
}
