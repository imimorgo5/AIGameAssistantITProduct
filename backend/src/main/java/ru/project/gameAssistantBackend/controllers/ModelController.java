package ru.project.gameAssistantBackend.controllers;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import ru.project.gameAssistantBackend.ai.ModelCatalog;
import ru.project.gameAssistantBackend.ai.OpenRouterClient;

import java.util.List;

@RestController
@RequestMapping("/api/models")
public class ModelController {
    private final ModelCatalog catalog;
    private final OpenRouterClient router;

    public ModelController(ModelCatalog catalog, OpenRouterClient router) {
        this.catalog = catalog;
        this.router = router;
    }

    @GetMapping
    public List<ModelCatalog.Option> models() {
        return catalog.options();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/registry")
    public ModelCatalog.Registry registry() {
        return catalog.registry();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/catalog")
    public List<OpenRouterClient.CatalogOption> remote() {
        return router.catalog();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public void add(@Valid @RequestBody ModelInput input) {
        catalog.add(input.remoteId(), input.name(), input.maxOutputTokens());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{id}")
    public void change(@PathVariable String id, @RequestBody ModelChange input) {
        if (!Boolean.TRUE.equals(input.isDefault()) && input.enabled() == null)
            throw new IllegalArgumentException("Укажите доступность модели");
        catalog.change(id, input.enabled(), false, Boolean.TRUE.equals(input.isDefault()));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        catalog.change(id, null, true, false);
    }

    public record ModelInput(
            @NotBlank @Size(max = 256) @Pattern(regexp = "[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.:/-]+")
                    String remoteId,
            @NotBlank @Size(max = 100) String name,
            @Min(256) @Max(32768) int maxOutputTokens) {}

    public record ModelChange(
            Boolean enabled,
            @com.fasterxml.jackson.annotation.JsonProperty("default") Boolean isDefault) {}
}
