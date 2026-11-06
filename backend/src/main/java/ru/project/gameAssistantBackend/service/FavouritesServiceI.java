package ru.project.gameAssistantBackend.service;

import ru.project.gameAssistantBackend.exception.customEx.conflict.FavouritesConflictException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;

public interface FavouritesServiceI {

    void addGameToUserFavourites(Long userId, Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException;

    void removeGameFromUserFavourites(Long userId, Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException;
}
