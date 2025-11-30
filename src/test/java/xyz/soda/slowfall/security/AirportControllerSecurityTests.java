package xyz.soda.slowfall.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
public class AirportControllerSecurityTests {

    private static final String DEV_BASIC_AUTH = "Basic ZGV2OmRldnBhc3M="; // dev:devpass

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listAirports_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/airports")).andExpect(status().isUnauthorized());
    }

    @Test
    void listAirports_authenticated_returns200() throws Exception {
        mockMvc.perform(get("/api/airports").header("Authorization", DEV_BASIC_AUTH))
                .andExpect(status().isOk());
    }

    @Test
    void createAirport_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/airports").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAirport_authenticated_canCreate_badRequestOnEmpty() throws Exception {
        mockMvc.perform(post("/api/airports")
                        .header("Authorization", DEV_BASIC_AUTH)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
