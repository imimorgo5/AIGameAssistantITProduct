package ru.project.gameAssistantBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.project.gameAssistantBackend.models.Token;
import ru.project.gameAssistantBackend.models.User;

import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByUser(User user);

    Optional<Token> findByBody(String body);
}
