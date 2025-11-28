package xyz.soda.slowfall.auth;

import com.nimbusds.jose.jwk.RSAKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class JwksControllerTest {

    private MockMvc mvc;

    @BeforeEach
    void setup() throws Exception {
        this.mvc = MockMvcBuilders.standaloneSetup(new JwksController(rsaKey())).build();
    }

    @Test
    void jwksEndpointReturns200() throws Exception {
        mvc.perform(get("/.well-known/jwks.json")).andExpect(status().isOk());
    }

    private RSAKey rsaKey() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
        return new RSAKey.Builder(pub).keyID("test-key").build();
    }
}
