package xyz.soda.slowfall.auth;

import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.KeyClientBuilder;
import com.azure.security.keyvault.keys.cryptography.CryptographyClient;
import com.azure.security.keyvault.keys.cryptography.CryptographyClientBuilder;
import com.azure.security.keyvault.keys.cryptography.models.SignResult;
import com.azure.security.keyvault.keys.models.JsonWebKey;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.util.Base64URL;
import com.nimbusds.jose.util.JSONObjectUtils;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import org.springframework.security.oauth2.jwt.*;

/**
 * JwtEncoder that uses Azure Key Vault's CryptographyClient to perform RSA signing (RS256).
 */
public class KeyVaultJwtSigner implements JwtEncoder {

    private final CryptographyClient cryptoClient;
    private final RSAKey rsaPublicJwk;

    /**
     * Create a KeyVaultJwtSigner using vault URL and key name. This will build
     * a KeyClient and CryptographyClient using DefaultAzureCredential.
     *
     * @param vaultUrl the Key Vault URL
     * @param keyName  the key name inside the vault
     */
    public KeyVaultJwtSigner(String vaultUrl, String keyName) {
        KeyClient keyClient = new KeyClientBuilder()
                .vaultUrl(vaultUrl)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();
        KeyVaultKey key = keyClient.getKey(keyName);
        this.cryptoClient = new CryptographyClientBuilder()
                .keyIdentifier(key.getId())
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();

        JsonWebKey jwk = key.getKey();
        try {
            this.rsaPublicJwk = RSAKey.parse(jwk.toJsonString());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse public JWK from Key Vault key: " + e.getMessage(), e);
        }
    }

    /**
     * Test-friendly constructor to inject a mock CryptographyClient and RSA public JWK.
     *
     * @param cryptoClient the CryptographyClient used to sign
     * @param rsaPublicJwk the RSA public JWK for the key id
     */
    public KeyVaultJwtSigner(CryptographyClient cryptoClient, RSAKey rsaPublicJwk) {
        this.cryptoClient = cryptoClient;
        this.rsaPublicJwk = rsaPublicJwk;
    }

    @Override
    public Jwt encode(JwtEncoderParameters parameters) throws JwtEncodingException {
        JwtClaimsSet claims = parameters.getClaims();
        Map<String, Object> claimMap = claims.getClaims();
        // Create a copy and convert Instant values to epoch seconds so JSON serialization
        // (used by Nimbus/Gson) doesn't attempt reflective access to java.time types.
        java.util.Map<String, Object> serializableClaims = new java.util.HashMap<>(claimMap);
        for (var entry : claimMap.entrySet()) {
            Object v = entry.getValue();
            if (v instanceof Instant inst) {
                serializableClaims.put(entry.getKey(), inst.getEpochSecond());
            }
        }

        try {
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .keyID(rsaPublicJwk.getKeyID())
                    .build();

            Payload payload = new Payload(JSONObjectUtils.toJSONString(serializableClaims));
            JWSObject jwsObject = new JWSObject(header, payload);

            // Get the signing input (header.payload) as bytes
            byte[] signingInput = jwsObject.getSigningInput();

            // Compute SHA-256 digest (RS256 signs the digest)
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(signingInput);

            // Use Key Vault to sign the digest with RSASSA-PKCS1-v1_5 (RS256)
            SignResult signResult = cryptoClient.sign(
                    com.azure.security.keyvault.keys.cryptography.models.SignatureAlgorithm.RS256, digest);
            byte[] signatureBytes = signResult.getSignature();

            // Attach signature as Base64URL
            Base64URL signature = Base64URL.encode(signatureBytes);
            // Construct compact serialization: <header>.<payload>.<signature>
            String compact = jwsObject.getHeader().toBase64URL().toString() + "."
                    + jwsObject.getPayload().toBase64URL().toString() + "." + signature;

            // Return a Spring Jwt constructed from compact token and claim set
            Instant issuedAt;
            Object iatObj = claimMap.get("iat");
            if (iatObj instanceof Number n) {
                issuedAt = Instant.ofEpochSecond(n.longValue());
            } else if (iatObj instanceof Instant inst) {
                issuedAt = inst;
            } else {
                issuedAt = Instant.now();
            }

            Instant expiresAt;
            Object expObj = claimMap.get("exp");
            if (expObj instanceof Number n2) {
                expiresAt = Instant.ofEpochSecond(n2.longValue());
            } else if (expObj instanceof Instant inst2) {
                expiresAt = inst2;
            } else {
                expiresAt = issuedAt.plusSeconds(900);
            }

            return new Jwt(compact, issuedAt, expiresAt, Map.of("alg", "RS256"), claimMap);

        } catch (Exception e) {
            throw new JwtEncodingException("Failed to build JWS: " + e.getMessage(), e);
        }
    }
}
