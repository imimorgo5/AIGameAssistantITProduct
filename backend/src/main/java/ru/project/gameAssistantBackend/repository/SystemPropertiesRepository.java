package ru.project.gameAssistantBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.project.gameAssistantBackend.models.SystemProperties;

@Repository
public interface SystemPropertiesRepository extends JpaRepository<SystemProperties, Long> {
}
