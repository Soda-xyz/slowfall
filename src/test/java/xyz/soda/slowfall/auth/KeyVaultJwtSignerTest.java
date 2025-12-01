package xyz.soda.slowfall.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

import com.azure.security.keyvault.keys.cryptography.CryptographyClient;
import com.azure.security.keyvault.keys.cryptography.models.SignResult;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.util.Base64URL;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;

public class KeyVaultJwtSignerTest {

    @Test
    void signerUsesCryptographyClientToSign() throws Exception {
        // Prepare mock CryptographyClient and SignResult
        CryptographyClient crypto = mock(CryptographyClient.class);
        SignResult sr = mock(SignResult.class);
        byte[] fakeSignature = new byte[] {0x01, 0x02, 0x03};
        when(sr.getSignature()).thenReturn(fakeSignature);
        when(crypto.sign(any(), any(byte[].class))).thenReturn(sr);

        // Create a simple RSA public JWK
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
        RSAKey rsaPub = new RSAKey.Builder(pub).keyID("test-kid").build();

        KeyVaultJwtSigner signer = new KeyVaultJwtSigner(crypto, rsaPub);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .claim("sub", "test-user")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        var jwt = signer.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(claims));
        assertNotNull(jwt);
        String token = jwt.getTokenValue();
        // token should be compact JWS with 3 parts
        assertEquals(3, token.split("\\.").length);

        // verify crypto client was called to sign a digest (any byte[] is fine)
        verify(crypto, atLeastOnce()).sign(any(), any(byte[].class));

        // verify signature portion matches our fakeSignature when base64url-decoded
        String[] parts = token.split("\\.");
        String sigPart = parts[2];
        assertEquals(Base64URL.encode(fakeSignature).toString(), sigPart);
    }
}
