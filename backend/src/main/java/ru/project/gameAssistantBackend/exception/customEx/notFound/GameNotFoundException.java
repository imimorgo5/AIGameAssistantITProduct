package ru.project.gameAssistantBackend.exception.customEx.notFound;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

public class GameNotFoundException extends GameAssistantNotFoundException {
    public GameNotFoundException(String message) {
        super(message);
    }
}
