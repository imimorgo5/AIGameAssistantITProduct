package ru.project.gameAssistantBackend.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.GenericFilterBean;

import java.io.IOException;

@Component
public class JwtFilter extends GenericFilterBean {
    private static final String AUTHORIZATION = "Authorization";
    private final JwtProvider jwtProvider;
    private final ru.project.gameAssistantBackend.repository.UserRepository users;

    @Autowired
    public JwtFilter(JwtProvider jwtProvider, ru.project.gameAssistantBackend.repository.UserRepository users) {
        this.jwtProvider = jwtProvider;
        this.users = users;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain fc)
            throws IOException, ServletException {
        final String token = getTokenFromRequest((HttpServletRequest) request);
        if (token != null && jwtProvider.validateAccessToken(token)) {
            final Claims claims = jwtProvider.getAccessClaims(token);
            users.findByEmail(claims.getSubject()).filter(user -> user.isEnabled() && user.getRefreshToken() != null).ifPresent(user -> {
                final JwtAuthentication authentication = new JwtAuthentication(user.getEmail(), user.getRole());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }
        fc.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        final String bearer = request.getHeader(AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
