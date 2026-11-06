package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.exception.customEx.conflict.FavouritesConflictException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.UserRepository;
import ru.project.gameAssistantBackend.service.FavouritesServiceI;

import java.util.Set;

@Service
public class FavouritesServiceImpl implements FavouritesServiceI {

    private final UserServiceImpl userServiceImpl;
    private final GameServiceImpl gameServiceImpl;
    private final UserRepository userRepository;

    @Autowired
    public FavouritesServiceImpl(UserServiceImpl userServiceImpl, GameServiceImpl gameServiceImpl, UserRepository userRepository) {
        this.userServiceImpl = userServiceImpl;
        this.gameServiceImpl = gameServiceImpl;
        this.userRepository = userRepository;
    }

    @Transactional
    @Override
    public void addGameToUserFavourites(Long userId, Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException {
        User user = userServiceImpl.getById(userId);
        Game game = gameServiceImpl.getGameById(gameId);
        Set<Game> userFavouriteGames = user.getGames();
        if(userFavouriteGames.contains(game)){
            throw new FavouritesConflictException("Игра с данным id уже добавлена в избранное пользователя!");
        }
        user.addGame(game);
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void removeGameFromUserFavourites(Long userId, Long gameId)
            throws UserNotFoundException, GameNotFoundException, FavouritesConflictException {
        User user = userServiceImpl.getById(userId);
        Game game = gameServiceImpl.getGameById(gameId);
        Set<Game> userFavouriteGames = user.getGames();
        if(!userFavouriteGames.contains(game)){
            throw new FavouritesConflictException("Игры с данным id нет в избранном пользователя!");
        }
        user.removeGame(game);
        userRepository.save(user);
    }
}
