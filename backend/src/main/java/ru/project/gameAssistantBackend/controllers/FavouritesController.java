package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import ru.project.gameAssistantBackend.dto.PagedResponseDTO;
import ru.project.gameAssistantBackend.dto.ResponseDTO;
import ru.project.gameAssistantBackend.dto.game.GamePreviewDTO;
import ru.project.gameAssistantBackend.exception.customEx.conflict.FavouritesConflictException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.service.impl.AuthServiceImpl;
import ru.project.gameAssistantBackend.service.impl.FavouritesServiceImpl;
import ru.project.gameAssistantBackend.mapper.GameMapper;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;
import ru.project.gameAssistantBackend.service.impl.UserServiceImpl;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/favourites")
public class FavouritesController {

    private final FavouritesServiceImpl favouritesServiceImpl;

    private final AuthServiceImpl authServiceImpl;

    private final UserServiceImpl userServiceImpl;

    private final GameMapper gameMapper;
    private final GameServiceImpl gameServiceImpl;

    @Autowired
    public FavouritesController(
            FavouritesServiceImpl favouritesServiceImpl,
            AuthServiceImpl authServiceImpl,
            UserServiceImpl userServiceImpl,
            GameMapper gameMapper,
            GameServiceImpl gameServiceImpl) {
        this.favouritesServiceImpl = favouritesServiceImpl;
        this.authServiceImpl = authServiceImpl;
        this.userServiceImpl = userServiceImpl;
        this.gameMapper = gameMapper;
        this.gameServiceImpl = gameServiceImpl;
    }

    @PostMapping("/{gameId}")
    public ResponseDTO addGameToFavourites(@PathVariable("gameId") Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException {
        String userEmail = authServiceImpl.getAuthenticatedUserEmail();
        Long userId = userServiceImpl.getByEmail(userEmail).getId();
        favouritesServiceImpl.addGameToUserFavourites(userId, gameId);
        String message = String.format("Игра с id=%d добавлена в избранные текущего пользователя", gameId);
        return new ResponseDTO(message);
    }

    @DeleteMapping("/{gameId}")
    public ResponseDTO removeGameFromFavourites(@PathVariable("gameId") Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException {
        String userEmail = authServiceImpl.getAuthenticatedUserEmail();
        Long userId = userServiceImpl.getByEmail(userEmail).getId();
        favouritesServiceImpl.removeGameFromUserFavourites(userId, gameId);
        return new ResponseDTO(String.format(
                "Игра с id=%d удалена из избранных текущего пользователя", gameId));
    }

    @GetMapping
    public List<GamePreviewDTO> getFavourites() throws UserNotFoundException {
        String userEmail = authServiceImpl.getAuthenticatedUserEmail();
        User user = userServiceImpl.getByEmail(userEmail);
        Set<Game> games = user.getGames();
        return gameMapper.mapToGamePreviewDTOs(games);
    }

    @GetMapping("/paged")
    public PagedResponseDTO<GamePreviewDTO> getPagedFavourites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction
    ) throws UserNotFoundException {
        String userEmail = authServiceImpl.getAuthenticatedUserEmail();
        User user = userServiceImpl.getByEmail(userEmail);

        Page<Game> pagedGames = gameServiceImpl.getPagedFavouriteGames(
                user, page, size, filter, category, sortBy, direction
        );

        return new PagedResponseDTO<>(
                gameMapper.mapToGamePreviewDTOs(pagedGames.getContent()),
                pagedGames.getTotalElements(),
                pagedGames.getTotalPages(),
                pagedGames.getNumber(),
                pagedGames.getSize()
        );
    }
}
