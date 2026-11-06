package ru.project.gameAssistantBackend.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import ru.project.gameAssistantBackend.models.Role;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminInitializerTest {
    private final UserRepository users = mock(UserRepository.class);
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();

    @Test
    void createsEnabledAdminWithEncodedPassword() {
        when(users.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        new AdminInitializer(users, passwords, "admin@example.com", "admin", "random-password").run(null);
        verify(users).save(argThat(user -> user.getRole() == Role.ADMIN
                && user.isEnabled() && passwords.matches("random-password", user.getPassword())));
    }

    @Test
    void leavesExistingAccountUnchangedOnRestart() {
        User existing = new User("admin@example.com", "member", "existing-hash", Role.USER, null);
        when(users.findByEmail(existing.getEmail())).thenReturn(Optional.of(existing));
        new AdminInitializer(users, passwords, existing.getEmail(), "admin", "new-password").run(null);
        verify(users, never()).save(any());
        assertEquals(Role.USER, existing.getRole());
        assertEquals("existing-hash", existing.getPassword());
    }

    @Test
    void rejectsIncompleteCredentialsAndAllowsDisabledBootstrap() {
        assertThrows(IllegalArgumentException.class,
                () -> new AdminInitializer(users, passwords, "admin@example.com", "admin", "").run(null));
        new AdminInitializer(users, passwords, "", "admin", "").run(null);
        verifyNoInteractions(users);
    }
}
