package ru.project.gameAssistantBackend.jwt;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import ru.project.gameAssistantBackend.models.Role;

import java.util.Collection;
import java.util.Set;

public class JwtAuthentication implements Authentication {
    private boolean authenticated = true;
    private final String email;
    private final Set<Role> roles;

    public JwtAuthentication(String email, Role role) {
        this.email = email;
        this.roles = Set.of(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return roles; }
    @Override
    public Object getCredentials() { return null; }
    @Override
    public Object getDetails() { return null; }
    @Override
    public Object getPrincipal() { return email; }
    @Override
    public boolean isAuthenticated() { return authenticated; }
    @Override
    public void setAuthenticated(boolean value) { authenticated = value; }
    @Override
    public String getName() { return email; }
}
