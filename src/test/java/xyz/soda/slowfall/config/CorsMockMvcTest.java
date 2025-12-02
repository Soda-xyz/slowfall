package xyz.soda.slowfall.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class CorsMockMvcTest {

    @Autowired
    MockMvc mvc;

    private String getAccessToken() throws Exception {
        ObjectMapper om = new ObjectMapper();
        String payload =
                om.writeValueAsString(new xyz.soda.slowfall.auth.AuthController.LoginRequest("dev", "devpass"));
        MvcResult r = mvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        String body = r.getResponse().getContentAsString();
        JsonNode node = om.readTree(body);
        return node.get("accessToken").asText();
    }

    @Test
    void preflight_allowsConfiguredOrigin() throws Exception {
        mvc.perform(options("/api/airports")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"));
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(authorities = "ROLE_1dea5e51-d15e-4081-9722-46da3bfdee79")
    void request_allowsConfiguredOrigin() throws Exception {
        mvc.perform(get("/api/airports").header("Origin", "http://localhost:5174"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"));
    }

    @Test
    void preflight_rejectsUnknownOrigin() throws Exception {
        mvc.perform(options("/api/airports")
                        .header("Origin", "https://evil.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(result ->
                        assertFalse(result.getResponse().containsHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)));
    }
}
