package ru.project.gameAssistantBackend.dto.chat;


public record SystemPropertiesDTO(
        @jakarta.validation.constraints.Size(max = 100000) String prompt,
        @jakarta.validation.constraints.Size(max = 200) String model
) {
}
