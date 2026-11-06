package ru.project.gameAssistantBackend.mapper;

import org.junit.jupiter.api.Test;
import ru.project.gameAssistantBackend.models.Game;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GameMapperTest {
    private final GameMapper mapper = new GameMapper();

    @Test
    void fullGameResponsePreservesLongMultilineDescription() {
        String description = "Подробное описание игры\n".repeat(60);
        Game game = new Game(1L, "Игра", description, Set.of(), "image.png", "rules.pdf");

        assertEquals(description, mapper.mapToGameResponseDTO(game).description());
        assertEquals(description, mapper.mapToGamePreviewDTO(game).description());
        assertEquals(description, game.getDescription());
    }

    @Test
    void fullGameResponsePreservesEmptyDescription() {
        Game game = new Game(1L, "Игра", "", Set.of(), null, null);

        assertEquals("", mapper.mapToGameResponseDTO(game).description());
    }
}
