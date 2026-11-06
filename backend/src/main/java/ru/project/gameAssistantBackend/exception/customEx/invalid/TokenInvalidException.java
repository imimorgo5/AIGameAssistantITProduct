package ru.project.gameAssistantBackend.exception.customEx.invalid;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantInvalidException;

public class TokenInvalidException extends GameAssistantInvalidException {
    public TokenInvalidException(String message) {
        super(message);
    }
}
