package xyz.soda.slowfall.auth;

import com.nimbusds.jose.jwk.RSAKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(JwksController.class)
@Import(JwksControllerTest.TestConfig.class)
@AutoConfigureMockMvc(addFilters = false)
public class JwksControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void jwksEndpointReturns200() throws Exception {
        mvc.perform(get("/.well-known/jwks.json")).andExpect(status().isOk());
    }

    @Configuration
    static class TestConfig {
        @Bean
        public RSAKey rsaKey() throws Exception {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            KeyPair kp = kpg.generateKeyPair();
            RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
            return new RSAKey.Builder(pub).keyID("test-key").build();
        }
    }
}
