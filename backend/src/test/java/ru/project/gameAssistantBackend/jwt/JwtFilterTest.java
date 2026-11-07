package ru.project.gameAssistantBackend.jwt;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.project.gameAssistantBackend.models.Role;
import ru.project.gameAssistantBackend.models.Token;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtFilterTest {
    private final JwtProvider provider = new JwtProvider("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==", "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ==");
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void usesCurrentDatabaseRoleAndRejectsLoggedOutSessions() throws Exception {
        User user = new User("player@example.com", "player", "encoded", Role.ADMIN, null);
        user.setEnabled(true);
        user.setRefreshToken(new Token(user, "refresh"));
        String token = provider.generateAccessToken(user);
        user.setRole(Role.USER);
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        JwtFilter filter = new JwtFilter(provider, users);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {});
        assertEquals(java.util.Set.of(Role.USER), java.util.Set.copyOf(SecurityContextHolder.getContext().getAuthentication().getAuthorities()));
        SecurityContextHolder.clearContext();
        user.setRefreshToken(null);
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {});
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
