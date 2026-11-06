package ru.project.gameAssistantBackend.service.impl;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.dto.jwt.JwtRequest;
import ru.project.gameAssistantBackend.dto.jwt.JwtResponse;
import ru.project.gameAssistantBackend.dto.user.UserRequestDTO;
import ru.project.gameAssistantBackend.exception.customEx.conflict.UserConflictException;
import ru.project.gameAssistantBackend.exception.customEx.invalid.TokenInvalidException;
import ru.project.gameAssistantBackend.exception.customEx.notEnabled.AccountNotEnabledException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.TokenNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.Token;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.TokenRepository;
import ru.project.gameAssistantBackend.repository.UserRepository;
import ru.project.gameAssistantBackend.service.AuthServiceI;
import ru.project.gameAssistantBackend.jwt.JwtProvider;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthServiceI {

    private final UserServiceImpl userServiceImpl;

    private final JwtProvider jwtProvider;

    private final UserRepository userRepository;

    private final TokenRepository tokenRepository;

    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthServiceImpl(UserServiceImpl userServiceImpl,
                           JwtProvider jwtProvider,
                           UserRepository userRepository,
                           TokenRepository tokenRepository,
                           PasswordEncoder passwordEncoder
    ) {
        this.userServiceImpl = userServiceImpl;
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    @Override
    public boolean isCredentialsCorrect(JwtRequest authRequest)
            throws UserNotFoundException, AccountNotEnabledException {
        User user = userServiceImpl.getByEmail(authRequest.email());
        if(!user.isEnabled()){
            throw new AccountNotEnabledException("Ваш аккаунт не подтвержден!");
        }
        return passwordEncoder.matches(authRequest.password(), user.getPassword());
    }

    @Transactional
    public JwtResponse login(User user){
        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        if (user.getRefreshToken() != null) {
            user.getRefreshToken().setBody(refreshToken);
        } else {
            user.setRefreshToken(new Token(user, refreshToken));
        }

        userRepository.save(user);
        return new JwtResponse(accessToken, refreshToken);
    }

    @Transactional
    @Override
    public User register(UserRequestDTO userRequestDTO) throws UserConflictException {
        String email = userRequestDTO.email();
        if(userRepository.findByEmail(email).isPresent()) {
            throw new UserConflictException("Пользователь с таким email уже существует!");
        }
        return userServiceImpl.create(userRequestDTO);
    }

    public User validateVerificationToken(String token) throws UserNotFoundException {
        User user = userRepository.findByVerificationToken(token).orElse(null);
        if (user == null) {
            throw new UserNotFoundException("Пользователь не найден");
        }

        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Override
    public JwtResponse getAccessToken(String refreshToken) throws UserNotFoundException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String email = claims.getSubject();
            User user = userServiceImpl.getByEmail(email);
            String saveRefreshToken = tokenRepository.findByUser(user).get().getBody();
            if (saveRefreshToken != null && saveRefreshToken.equals(refreshToken)) {
                final String accessToken = jwtProvider.generateAccessToken(user);
                return new JwtResponse(accessToken, null);
            }
        }
        return new JwtResponse(null, null);
    }

    @Transactional
    @Override
    public JwtResponse refresh(String refreshToken)
            throws UserNotFoundException, TokenNotFoundException, TokenInvalidException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String email = claims.getSubject();
            User user = userServiceImpl.getByEmail(email);
            Optional<Token> saveRefreshToken = tokenRepository.findByUser(user);
            if (saveRefreshToken.isPresent() && saveRefreshToken.get().getBody().equals(refreshToken)) {
                final String accessToken = jwtProvider.generateAccessToken(user);
                final String newRefreshToken = jwtProvider.generateRefreshToken(user);
                Token existingToken = tokenRepository.findByUser(user)
                        .orElseThrow(() -> new TokenNotFoundException("Токен не найден"));
                existingToken.setBody(newRefreshToken);
                tokenRepository.save(existingToken);
                return new JwtResponse(accessToken, newRefreshToken);
            }
        }
        throw new TokenInvalidException("Невалидный JWT токен");
    }

    @Transactional
    @Override
    public void logout(String refreshToken) throws TokenNotFoundException {
        Token token = tokenRepository.findByBody(refreshToken)
                .orElseThrow(() -> new TokenNotFoundException("Токен не найден"));

        User user = token.getUser();
        user.setRefreshToken(null);
        userRepository.save(user);
    }

    @Override
    public String getAuthenticatedUserEmail(){
        return SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
    }

    @Override
    public User getAuthenticatedUser()
            throws UserNotFoundException {
        String email = getAuthenticatedUserEmail();
        return userServiceImpl.getByEmail(email);
    }
}
