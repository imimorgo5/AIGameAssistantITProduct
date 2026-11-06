package ru.project.gameAssistantBackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.config.import=",
		"ai.default-model=test",
		"ai.models[0].id=test",
		"ai.models[0].name=Test model",
		"ai.models[0].remote-id=test/model",
		"spring.datasource.url=jdbc:h2:mem:context;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.liquibase.enabled=false",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"jwt.secret.access=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
		"jwt.secret.refresh=AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ==",
		"app.admin.email=",
		"app.admin.password="
})
class GameAssistantBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
