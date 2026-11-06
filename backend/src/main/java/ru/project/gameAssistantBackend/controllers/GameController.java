package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.project.gameAssistantBackend.dto.PagedResponseDTO;
import ru.project.gameAssistantBackend.dto.game.GamePreviewDTO;
import ru.project.gameAssistantBackend.dto.game.GameRequestDTO;
import ru.project.gameAssistantBackend.dto.game.GameResponseDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.CategoryNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.mapper.GameMapper;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameServiceImpl gameServiceImpl;

    private final GameMapper gameMapper;

    @Autowired
    public GameController(
            GameServiceImpl gameServiceImpl,
            GameMapper gameMapper
    ) {
        this.gameServiceImpl = gameServiceImpl;
        this.gameMapper = gameMapper;
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public GameResponseDTO create(@ModelAttribute GameRequestDTO gameRequestDTO)
            throws CategoryNotFoundException {
        Game game = gameServiceImpl.create(gameRequestDTO);
        return gameMapper.mapToGameResponseDTO(game);
    }

    @GetMapping("/{gameId}")
    public GameResponseDTO read(@PathVariable("gameId") Long gameId)
            throws GameNotFoundException {
        Game game = gameServiceImpl.getGameById(gameId);
        return gameMapper.mapToGameResponseDTO(game);
    }

    @GetMapping
    public List<GamePreviewDTO> readAll() {
        List<Game> games = gameServiceImpl.getAllGames();
        return gameMapper.mapToGamePreviewDTOs(games);
    }

    @GetMapping("/paged")
    public PagedResponseDTO<GamePreviewDTO> readAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction
    ){
        Page<Game> pagedGames = gameServiceImpl.getPagedGames(
                page, size, filter, category, sortBy, direction);
        return new PagedResponseDTO<>(
                gameMapper.mapToGamePreviewDTOs(pagedGames.getContent()),
                pagedGames.getTotalElements(),
                pagedGames.getTotalPages(),
                pagedGames.getNumber(),
                pagedGames.getSize()
        );
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping(value = "/{gameId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GameResponseDTO update(
            @PathVariable("gameId") Long gameId,
            @ModelAttribute GameRequestDTO gameDTO)
            throws GameNotFoundException, CategoryNotFoundException {
        Game game = gameServiceImpl.update(gameId, gameDTO);
        return gameMapper.mapToGameResponseDTO(game);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{gameId}")
    public void delete(@PathVariable("gameId") Long gameId)
            throws GameNotFoundException {
        gameServiceImpl.delete(gameId);
    }
}
