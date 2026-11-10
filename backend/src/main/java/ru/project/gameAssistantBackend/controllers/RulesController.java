package ru.project.gameAssistantBackend.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import ru.project.gameAssistantBackend.ai.RulesService;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;

import java.util.Map;

@RestController
@RequestMapping("/api/games/{id}/rules")
public class RulesController {
    private final RulesService rules;
    private final GameServiceImpl games;

    public RulesController(RulesService rules, GameServiceImpl games) {
        this.rules = rules;
        this.games = games;
    }

    @GetMapping("/status")
    public Map<String, Object> status(@PathVariable Long id) throws GameNotFoundException {
        return rules.status(games.getGameById(id).getRulesFileTitle());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/retry")
    public void retry(@PathVariable Long id) throws GameNotFoundException {
        rules.retry(games.getGameById(id).getRulesFileTitle());
    }
}
