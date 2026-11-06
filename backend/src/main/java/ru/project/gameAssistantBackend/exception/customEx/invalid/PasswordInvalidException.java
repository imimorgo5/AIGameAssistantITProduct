package ru.project.gameAssistantBackend.exception.customEx.invalid;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantInvalidException;

public class PasswordInvalidException extends GameAssistantInvalidException {
    public PasswordInvalidException(String message) {
        super(message);
    }
}
