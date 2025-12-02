package xyz.soda.slowfall.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@ActiveProfiles("dev")
@AutoConfigureMockMvc
public class JwtMockMvcTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void requestWithValidJwt_isAuthorized() throws Exception {
        mockMvc.perform(get("/api/protected/resource")
                        .with(jwt().authorities(java.util.List.of(new SimpleGrantedAuthority("ROLE_1dea5e51-d15e-4081-9722-46da3bfdee79")))))
                .andExpect(status().isOk());
    }

    @Test
    void requestWithExpiredJwt_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/protected/resource").with(jwt().jwt(jwt -> jwt.expiresAt(java.time.Instant.EPOCH))))
                .andExpect(status().isUnauthorized());
    }
}
