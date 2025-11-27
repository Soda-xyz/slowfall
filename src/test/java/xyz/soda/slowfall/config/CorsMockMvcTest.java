package xyz.soda.slowfall.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class CorsMockMvcTest {

    @Autowired
    MockMvc mvc;

    @Test
    void preflight_allowsConfiguredOrigin() throws Exception {
        mvc.perform(options("/api/airports")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"));
    }

    @Test
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
