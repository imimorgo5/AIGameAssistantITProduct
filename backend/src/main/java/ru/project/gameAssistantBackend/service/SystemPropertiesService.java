package ru.project.gameAssistantBackend.service;

import ru.project.gameAssistantBackend.dto.chat.SystemPropertiesDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.models.SystemProperties;

public interface SystemPropertiesService {

    SystemProperties getSystemProperties() throws SystemPropertiesNotFoundException;

    String getPromptText() throws SystemPropertiesNotFoundException;

    SystemProperties updatePrompt(SystemPropertiesDTO systemPropertiesDTO) throws SystemPropertiesNotFoundException;
}
