package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.dto.chat.SystemPropertiesDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.models.SystemProperties;
import ru.project.gameAssistantBackend.repository.SystemPropertiesRepository;
import ru.project.gameAssistantBackend.service.SystemPropertiesService;

@Service
public class SystemPropertiesServiceImpl implements SystemPropertiesService {

    private final SystemPropertiesRepository systemPropertiesRepository;

    @Autowired
    public SystemPropertiesServiceImpl(SystemPropertiesRepository systemPropertiesRepository) {
        this.systemPropertiesRepository = systemPropertiesRepository;
    }

    @Override
    public SystemProperties getSystemProperties() throws SystemPropertiesNotFoundException {
        return systemPropertiesRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new SystemPropertiesNotFoundException("Системные настройки не найдены"));
    }

    @Override
    public String getPromptText() throws SystemPropertiesNotFoundException {
        return getSystemProperties().getPrompt();
    }

    @Transactional
    @Override
    public SystemProperties updatePrompt(SystemPropertiesDTO systemPropertiesDTO) throws SystemPropertiesNotFoundException {
        SystemProperties systemProperties = getSystemProperties();
        systemProperties.setPrompt(systemPropertiesDTO.prompt());
        return systemPropertiesRepository.save(systemProperties);
    }

    @Transactional
    public SystemProperties updateModel(SystemPropertiesDTO systemPropertiesDTO) throws SystemPropertiesNotFoundException {
        SystemProperties systemProperties = getSystemProperties();
        systemProperties.setModel(systemPropertiesDTO.model());
        return systemPropertiesRepository.save(systemProperties);
    }
}
