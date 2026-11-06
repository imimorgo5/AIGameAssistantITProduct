package ru.project.gameAssistantBackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.models.Role;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.UserRepository;

@Component
public class AdminInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String email;
    private final String login;
    private final String password;

    public AdminInitializer(UserRepository users, PasswordEncoder passwords,
                            @Value("${app.admin.email:}") String email,
                            @Value("${app.admin.login:admin}") String login,
                            @Value("${app.admin.password:}") String password) {
        this.users = users;
        this.passwords = passwords;
        this.email = email;
        this.login = login;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank()) {
            return;
        }
        if (email.isBlank() || password.isBlank()) {
            throw new IllegalArgumentException("Set both ADMIN_EMAIL and ADMIN_PASSWORD");
        }
        if (users.findByEmail(email).isPresent()) {
            return;
        }
        User admin = new User(email, login, passwords.encode(password), Role.ADMIN, null);
        admin.setEnabled(true);
        users.save(admin);
    }
}
