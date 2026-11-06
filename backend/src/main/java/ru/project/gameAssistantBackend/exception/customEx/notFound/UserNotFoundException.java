package ru.project.gameAssistantBackend.exception.customEx.notFound;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

public class UserNotFoundException extends GameAssistantNotFoundException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
