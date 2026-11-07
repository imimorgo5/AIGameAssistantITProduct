package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ru.project.gameAssistantBackend.dto.chat.SystemPropertiesDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.models.SystemProperties;
import ru.project.gameAssistantBackend.service.impl.SystemPropertiesServiceImpl;

@RestController
@RequestMapping("/api/system")
public class SystemPropertiesController {

    private final SystemPropertiesServiceImpl systemPropertiesServiceImpl;
    private final ru.project.gameAssistantBackend.ai.ModelCatalog catalog;

    @Autowired
    public SystemPropertiesController(SystemPropertiesServiceImpl systemPropertiesServiceImpl, ru.project.gameAssistantBackend.ai.ModelCatalog catalog) {
        this.systemPropertiesServiceImpl = systemPropertiesServiceImpl;
        this.catalog = catalog;
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public SystemPropertiesDTO getSystemProperties() throws SystemPropertiesNotFoundException {
        SystemProperties systemProperties = systemPropertiesServiceImpl.getSystemProperties();
        return mapToDTO(systemProperties);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/prompt")
    public String getPrompt() throws SystemPropertiesNotFoundException {
        return systemPropertiesServiceImpl.getSystemProperties().getPrompt();
    }

    @GetMapping("/model")
    public java.util.Map<String, String> getModel() throws SystemPropertiesNotFoundException {
        return java.util.Map.of("model", catalog.resolve(null, systemPropertiesServiceImpl.getSystemProperties().getModel()).id());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/prompt")
    public SystemPropertiesDTO updatePrompt(@jakarta.validation.Valid @RequestBody SystemPropertiesDTO systemPropertiesDTO) throws SystemPropertiesNotFoundException {
        SystemProperties systemProperties = systemPropertiesServiceImpl.updatePrompt(systemPropertiesDTO);
        return mapToDTO(systemProperties);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/model")
    public SystemPropertiesDTO updateModel(@jakarta.validation.Valid @RequestBody SystemPropertiesDTO systemPropertiesDTO) throws SystemPropertiesNotFoundException {
        catalog.requireEnabled(systemPropertiesDTO.model());
        SystemProperties systemProperties = systemPropertiesServiceImpl.updateModel(systemPropertiesDTO);
        return mapToDTO(systemProperties);
    }

    public SystemPropertiesDTO mapToDTO(SystemProperties systemProperties){
        return new SystemPropertiesDTO(
                systemProperties.getPrompt(), catalog.resolve(null, systemProperties.getModel()).id());
    }
}
