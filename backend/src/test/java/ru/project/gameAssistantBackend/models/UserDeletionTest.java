package ru.project.gameAssistantBackend.models;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = { "spring.config.import=", "spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop" })
class UserDeletionTest {
    @Autowired EntityManager entityManager;

    @Test
    void deletingAUserRemovesTheirChatsButKeepsTheSharedGame() {
        Game game = new Game();
        game.setTitle("Shared game");
        entityManager.persist(game);
        User user = new User("player@example.com", "player", "encoded", Role.USER, null);
        user.setEnabled(true);
        user.addGame(game);
        entityManager.persist(user);
        Chat chat = new Chat();
        chat.setUzer(user);
        chat.setGame(game);
        chat.setTitle("Private chat");
        chat.setLastUseTime(Instant.now());
        chat.addMessage("Private question", ChatRole.user);
        entityManager.persist(chat);
        entityManager.flush();
        Long gameId = game.getId();
        Long userId = user.getId();
        Long chatId = chat.getId();
        entityManager.clear();
        entityManager.remove(entityManager.find(User.class, userId));
        entityManager.flush();
        entityManager.clear();
        assertNotNull(entityManager.find(Game.class, gameId));
        assertNull(entityManager.find(User.class, userId));
        assertNull(entityManager.find(Chat.class, chatId));
        assertEquals(0L, entityManager.createQuery("select count(m) from Message m", Long.class).getSingleResult());
    }
}
