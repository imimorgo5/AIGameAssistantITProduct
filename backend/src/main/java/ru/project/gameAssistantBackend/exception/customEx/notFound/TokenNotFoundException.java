package ru.project.gameAssistantBackend.exception.customEx.notFound;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

public class TokenNotFoundException extends GameAssistantNotFoundException {
    public TokenNotFoundException(String message) {
        super(message);
    }
}
