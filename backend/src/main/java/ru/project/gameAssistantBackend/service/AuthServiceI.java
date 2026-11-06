package ru.project.gameAssistantBackend.service;

import ru.project.gameAssistantBackend.dto.jwt.JwtRequest;
import ru.project.gameAssistantBackend.dto.jwt.JwtResponse;
import ru.project.gameAssistantBackend.dto.user.UserRequestDTO;
import ru.project.gameAssistantBackend.exception.customEx.conflict.UserConflictException;
import ru.project.gameAssistantBackend.exception.customEx.invalid.PasswordInvalidException;
import ru.project.gameAssistantBackend.exception.customEx.invalid.TokenInvalidException;
import ru.project.gameAssistantBackend.exception.customEx.notEnabled.AccountNotEnabledException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.TokenNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.User;

public interface AuthServiceI {

    boolean isCredentialsCorrect(JwtRequest authRequest)
            throws UserNotFoundException, PasswordInvalidException, AccountNotEnabledException;

    User register(UserRequestDTO userRequestDTO)
            throws UserConflictException;

    JwtResponse getAccessToken(String refreshToken)
            throws UserNotFoundException;

    JwtResponse refresh(String refreshToken)
            throws UserNotFoundException, TokenNotFoundException, TokenInvalidException;

    void logout(String refreshToken)
            throws TokenNotFoundException;

    String getAuthenticatedUserEmail();

    User getAuthenticatedUser() throws UserNotFoundException;
}
