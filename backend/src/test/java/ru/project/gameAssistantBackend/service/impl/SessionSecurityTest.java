package ru.project.gameAssistantBackend.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import ru.project.gameAssistantBackend.ai.ModelCatalog;
import ru.project.gameAssistantBackend.jwt.JwtProvider;
import ru.project.gameAssistantBackend.models.Role;
import ru.project.gameAssistantBackend.models.Token;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.TokenRepository;
import ru.project.gameAssistantBackend.repository.UserRepository;
import ru.project.gameAssistantBackend.specification.UserSpecification;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionSecurityTest {
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final UserServiceImpl service = new UserServiceImpl(users, passwords, mock(FileServiceImpl.class), mock(UserSpecification.class), mock(ModelCatalog.class));

    @Test
    void passwordResetExpiresConsumesTokenAndRevokesSession() {
        User user = new User();
        user.setPasswordResetToken("one-time");
        user.setPasswordResetExpiresAt(Instant.now().plusSeconds(60));
        user.setRefreshToken(new Token(user, "refresh"));
        when(users.findByPasswordResetToken("one-time")).thenReturn(Optional.of(user));
        when(passwords.encode("new-password")).thenReturn("encoded");
        service.resetPassword("one-time", "new-password");
        assertNull(user.getPasswordResetToken());
        assertNull(user.getPasswordResetExpiresAt());
        assertNull(user.getRefreshToken());
        assertEquals("encoded", user.getPassword());
        user.setPasswordResetExpiresAt(Instant.now().minusSeconds(1));
        assertThrows(IllegalArgumentException.class, () -> service.resetPassword("one-time", "other"));
        verify(passwords, times(1)).encode(anyString());
    }

    @Test
    void roleEndpointsAreIdempotentRatherThanToggles() throws Exception {
        User user = new User();
        user.setRole(Role.ADMIN);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        service.updateRole(1L, Role.ADMIN);
        service.updateRole(1L, Role.ADMIN);
        assertEquals(Role.ADMIN, user.getRole());
        service.updateRole(1L, Role.USER);
        service.updateRole(1L, Role.USER);
        assertEquals(Role.USER, user.getRole());
    }

    @Test
    void emailConfirmationConsumesTheLoginLink() throws Exception {
        User user = new User();
        user.setVerificationToken("one-time");
        when(users.findByVerificationToken("one-time")).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
        AuthServiceImpl auth = new AuthServiceImpl(service, mock(JwtProvider.class), users, mock(TokenRepository.class), passwords);
        auth.validateVerificationToken("one-time");
        assertTrue(user.isEnabled());
        assertNull(user.getVerificationToken());
    }
}
