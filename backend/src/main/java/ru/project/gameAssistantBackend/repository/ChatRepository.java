package ru.project.gameAssistantBackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.project.gameAssistantBackend.models.Chat;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    List<Chat> findByUzerIdAndGameId(Long uzerId, Long gameId);

    List<Chat> findByUzerId(Long uzerId);

    Page<Chat> findByUzerIdAndGameId(Long uzerId, Long gameId, Pageable pageable);

    Page<Chat> findByUzerId(Long uzerId, Pageable pageable);
}
