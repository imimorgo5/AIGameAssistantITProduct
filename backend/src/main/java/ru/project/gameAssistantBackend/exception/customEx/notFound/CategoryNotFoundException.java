package ru.project.gameAssistantBackend.exception.customEx.notFound;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

public class CategoryNotFoundException extends GameAssistantNotFoundException {
    public CategoryNotFoundException(String message) {
        super(message);
    }
}
