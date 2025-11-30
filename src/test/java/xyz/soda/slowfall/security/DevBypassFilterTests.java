package xyz.soda.slowfall.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
public class DevBypassFilterTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void devBypass_allowsAccessWhenNoAuth() throws Exception {
        // In dev profile the DevBypassAuthFilter should allow requests without auth
        mockMvc.perform(get("/api/protected/resource")).andExpect(status().isOk());
    }
}
