package ru.project.gameAssistantBackend.dto.category;

public record CategoryRequestDTO(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100) String name) {
}
