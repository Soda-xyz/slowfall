package xyz.soda.slowfall.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
public class PersonControllerSecurityTests {

    private static final String DEV_BASIC_AUTH = "Basic ZGV2OmRldnBhc3M="; // dev:devpass

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listPerson_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/person")).andExpect(status().isUnauthorized());
    }

    @Test
    void listPerson_authenticated_returns200() throws Exception {
        mockMvc.perform(get("/api/person").header("Authorization", DEV_BASIC_AUTH))
                .andExpect(status().isOk());
    }

    @Test
    void createPerson_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/person").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createPerson_authenticated_canCreate() throws Exception {
        mockMvc.perform(post("/api/person")
                        .header("Authorization", DEV_BASIC_AUTH)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest()); // empty payload leads to 400 from controller validation
    }
}
