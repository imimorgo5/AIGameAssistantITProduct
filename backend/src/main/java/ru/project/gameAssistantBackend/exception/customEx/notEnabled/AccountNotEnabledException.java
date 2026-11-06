package ru.project.gameAssistantBackend.exception.customEx.notEnabled;

public class AccountNotEnabledException extends Exception {
    public AccountNotEnabledException(String message) {
        super(message);
    }
}
