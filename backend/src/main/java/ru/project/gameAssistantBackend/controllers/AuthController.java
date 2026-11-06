package ru.project.gameAssistantBackend.controllers;

import jakarta.security.auth.message.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.project.gameAssistantBackend.dto.ResetPasswordDTO;
import ru.project.gameAssistantBackend.dto.jwt.JwtRequest;
import ru.project.gameAssistantBackend.dto.jwt.JwtResponse;
import ru.project.gameAssistantBackend.dto.jwt.RefreshJwtRequest;
import ru.project.gameAssistantBackend.dto.user.UserRequestDTO;
import ru.project.gameAssistantBackend.dto.user.UserResponseDTO;
import ru.project.gameAssistantBackend.exception.customEx.conflict.UserConflictException;
import ru.project.gameAssistantBackend.exception.customEx.invalid.PasswordInvalidException;
import ru.project.gameAssistantBackend.exception.customEx.invalid.TokenInvalidException;
import ru.project.gameAssistantBackend.exception.customEx.notEnabled.AccountNotEnabledException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.TokenNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.mapper.UserMapper;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.service.impl.AuthServiceImpl;
import ru.project.gameAssistantBackend.service.impl.EmailService;
import ru.project.gameAssistantBackend.service.impl.UserServiceImpl;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthServiceImpl authServiceImpl;

    private final UserMapper userMapper;

    private final UserServiceImpl userServiceImpl;

    private final EmailService emailService;

    @Autowired
    public AuthController(
            AuthServiceImpl authServiceImpl,
            UserMapper userMapper,
            UserServiceImpl userServiceImpl,
            EmailService emailService
    ) {
        this.authServiceImpl = authServiceImpl;
        this.userMapper = userMapper;
        this.userServiceImpl = userServiceImpl;
        this.emailService = emailService;
    }

    @GetMapping("/me")
    public UserResponseDTO getAuthenticatedUser() throws UserNotFoundException {
        String personEmail = authServiceImpl.getAuthenticatedUserEmail();
        User user = userServiceImpl.getByEmail(personEmail);
        return userMapper.mapToResponseDTO(user);
    }

    @PostMapping("/login")
    public JwtResponse login(@RequestBody JwtRequest authRequest)
            throws UserNotFoundException, PasswordInvalidException,
            AccountNotEnabledException, AuthException {
        if(authServiceImpl.isCredentialsCorrect(authRequest)){
            User user = userServiceImpl.getByEmail(authRequest.email());
            return authServiceImpl.login(user);
        } else {
            throw new PasswordInvalidException("Неправильный пароль");
        }
    }

    @PostMapping("/register")
    public UserResponseDTO registration(@RequestBody UserRequestDTO userRequestDTO)
            throws UserConflictException {
        User user = authServiceImpl.register(userRequestDTO);
        emailService.sendEmailConfirmEmail(user.getEmail(), user.getVerificationToken());
        return userMapper.mapToResponseDTO(user);
    }

    @PostMapping("/logout")
    public String logout(@RequestBody RefreshJwtRequest request)
            throws TokenNotFoundException {
        authServiceImpl.logout(request.refreshToken());
        return "Вы вышли из аккаунта";
    }

    @PostMapping("/token")
    public JwtResponse getNewAccessToken(@RequestBody RefreshJwtRequest request)
            throws UserNotFoundException {
        return authServiceImpl.getAccessToken(request.refreshToken());
    }

    @PostMapping("/refresh")
    public JwtResponse getNewRefreshToken(@RequestBody RefreshJwtRequest request)
            throws UserNotFoundException, TokenNotFoundException, TokenInvalidException {
        return authServiceImpl.refresh(request.refreshToken());
    }

    @PostMapping("/verify-email")
    public JwtResponse verifyEmail(@RequestParam("token") String token)
            throws UserNotFoundException {
        User user = authServiceImpl.validateVerificationToken(token);
        return authServiceImpl.login(user);
    }

    @PostMapping("/forgot-password")
    public String requestForResetPassword(@RequestParam("email") String email)
            throws UserNotFoundException {
        User user = userServiceImpl.getByEmail(email);
        String token = userServiceImpl.setPasswordResetToken(user);
        emailService.sendPasswordResetEmail(email, token);
        return "Запрос на обновление пароля отправлен на указанный email";
    }

    @PatchMapping("/reset-password")
    public String resetPassword(@RequestBody ResetPasswordDTO resetPasswordDTO){
        User user = userServiceImpl.getUserByPasswordResetToken(resetPasswordDTO.token());
        userServiceImpl.setNullPasswordResetToken(user);
        userServiceImpl.updatePassword(user, resetPasswordDTO.password());
        return "Пароль успешно обновлен";
    }
}
