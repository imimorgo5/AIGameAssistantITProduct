package ru.project.gameAssistantBackend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.project.gameAssistantBackend.ai.ModelCatalog;

import java.util.List;

@RestController
public class ModelController {
    private final ModelCatalog catalog;
    public ModelController(ModelCatalog catalog) { this.catalog = catalog; }

    @GetMapping({"/api/models", "/api/chat/models"})
    public List<ModelCatalog.Option> models() { return catalog.options(); }
}
