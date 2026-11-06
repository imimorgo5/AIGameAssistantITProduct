package ru.project.gameAssistantBackend.exception.customEx.conflict;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantConflictException;

public class UserConflictException extends GameAssistantConflictException {
    public UserConflictException(String message) {
        super(message);
    }
}
