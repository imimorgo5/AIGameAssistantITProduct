package ru.project.gameAssistantBackend.exception.customEx.notFound;

import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

public class SystemPropertiesNotFoundException extends GameAssistantNotFoundException {
    public SystemPropertiesNotFoundException(String message) {
        super(message);
    }
}
