package ru.project.gameAssistantBackend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import ru.project.gameAssistantBackend.dto.game.GameRequestDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.CategoryNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.models.Game;

public interface GameServiceI {

    Page<Game> getPagedGames(
            int page, int size, String filter, String category, String sortBy, Sort.Direction direction);

    Game getGameById(Long id) throws GameNotFoundException;

    Game create(GameRequestDTO gameRequestDTO) throws CategoryNotFoundException;

    Game update(Long id, GameRequestDTO gameDTO) throws GameNotFoundException, CategoryNotFoundException;

    void delete(Long id) throws GameNotFoundException;
}
