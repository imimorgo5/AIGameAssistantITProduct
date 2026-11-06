package ru.project.gameAssistantBackend.exception.customEx.conflict;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantConflictException;

public class FavouritesConflictException extends GameAssistantConflictException {
    public FavouritesConflictException(String message) {
        super(message);
    }
}
