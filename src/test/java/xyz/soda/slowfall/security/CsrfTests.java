package xyz.soda.slowfall.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class CsrfTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(authorities = "ROLE_1dea5e51-d15e-4081-9722-46da3bfdee79")
    void postWithoutCsrfToken_isForbidden() throws Exception {
        mockMvc.perform(post("/api/protected/resource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_1dea5e51-d15e-4081-9722-46da3bfdee79")
    void postWithCsrfToken_isOk() throws Exception {
        mockMvc.perform(post("/api/protected/resource")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }
}
