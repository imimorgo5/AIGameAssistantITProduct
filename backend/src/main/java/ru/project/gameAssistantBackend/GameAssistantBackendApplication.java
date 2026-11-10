package ru.project.gameAssistantBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class GameAssistantBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GameAssistantBackendApplication.class, args);
	}

}
