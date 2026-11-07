package ru.project.gameAssistantBackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
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

    @org.springframework.beans.factory.annotation.Autowired
    org.springframework.test.web.servlet.MockMvc mvc;

    @Test
    void rejectsInvalidInputAndProtectsMutationsAtTheBackend() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/register")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content("{\"email\":\"invalid\",\"login\":\"\",\"password\":\"a\"}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/me"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/games/1"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    }

	@Test
	void contextLoads() {
	}

}
