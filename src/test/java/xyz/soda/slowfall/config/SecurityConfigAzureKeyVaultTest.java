package xyz.soda.slowfall.config;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.nimbusds.jose.jwk.RSAKey;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SecurityConfigAzureKeyVaultTest {

    @Test
    public void rsaKeyFromAzureKeyVault_parsesPem() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        byte[] pkcs8 = kp.getPrivate().getEncoded();
        String b64 = Base64.getEncoder().encodeToString(pkcs8);
        // split into lines to be PEM-friendly
        String pem = "-----BEGIN PRIVATE KEY-----\n" + b64 + "\n-----END PRIVATE KEY-----";

        SecretClient secretClient = mock(SecretClient.class);
        when(secretClient.getSecret("test-secret")).thenReturn(new KeyVaultSecret("test-secret", pem));

        SecurityConfig cfg = new SecurityConfig();
        RSAKey rsa = cfg.rsaKeyFromAzureKeyVault("https://fake.vault", "test-secret", secretClient);
        assertNotNull(rsa);
        assertNotNull(rsa.toRSAPublicKey());
    }
}
