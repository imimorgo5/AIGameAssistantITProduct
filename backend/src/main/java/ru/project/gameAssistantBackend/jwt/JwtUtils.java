package ru.project.gameAssistantBackend.jwt;

import io.jsonwebtoken.Claims;
import ru.project.gameAssistantBackend.models.Role;

import java.util.Set;

public class JwtUtils {

    private JwtUtils(){
    }

    public static JwtAuthentication generate(Claims claims) {
        final JwtAuthentication jwtInfoToken = new JwtAuthentication();
        jwtInfoToken.setRoles(getRoles(claims));
        jwtInfoToken.setFirstName(claims.get("firstName", String.class));
        jwtInfoToken.setUsername(claims.getSubject());
        return jwtInfoToken;
    }

    private static Set<Role> getRoles(Claims claims) {
        String role = claims.get("role", String.class);
        if (role == null) {
            return Set.of();
        }
        return Set.of(Role.valueOf(role));
    }
}
