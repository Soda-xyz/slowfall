package xyz.soda.slowfall.auth;

import com.azure.security.keyvault.keys.cryptography.CryptographyClient;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.security.oauth2.jwt.*;

/**
 * JwtEncoder that uses Azure Key Vault's CryptographyClient to perform RSA signing (RS256).
 *
 * <p>Note: Do NOT construct credentials inside this class. Inject a configured
 * CryptographyClient (built using the application's TokenCredential bean) instead.
 */
public class KeyVaultJwtSigner implements JwtEncoder {

    private final CryptographyClient cryptoClient;
    private final RSAKey rsaPublicJwk;

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
        java.util.Map<String, Object> claimMap = claims.getClaims();
        // Create a copy and convert Instant values to epoch seconds so JSON serialization
        // (used by Nimbus/Gson) doesn't attempt reflective access to java.time types.
        java.util.Map<String, Object> serializableClaims = new java.util.HashMap<>(claimMap);
        for (var entry : claimMap.entrySet()) {
            Object v = entry.getValue();
            if (v instanceof java.time.Instant inst) {
                serializableClaims.put(entry.getKey(), inst.getEpochSecond());
            }
        }

        try {
            com.nimbusds.jose.JWSHeader header = new com.nimbusds.jose.JWSHeader.Builder(
                            com.nimbusds.jose.JWSAlgorithm.RS256)
                    .keyID(rsaPublicJwk.getKeyID())
                    .build();

            com.nimbusds.jose.Payload payload = new com.nimbusds.jose.Payload(
                    com.nimbusds.jose.util.JSONObjectUtils.toJSONString(serializableClaims));
            com.nimbusds.jose.JWSObject jwsObject = new com.nimbusds.jose.JWSObject(header, payload);

            // Get the signing input (header.payload) as bytes
            byte[] signingInput = jwsObject.getSigningInput();

            // Compute SHA-256 digest (RS256 signs the digest)
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(signingInput);

            // Use Key Vault to sign the digest with RSASSA-PKCS1-v1_5 (RS256)
            com.azure.security.keyvault.keys.cryptography.models.SignResult signResult = cryptoClient.sign(
                    com.azure.security.keyvault.keys.cryptography.models.SignatureAlgorithm.RS256, digest);
            byte[] signatureBytes = signResult.getSignature();

            // Attach signature as Base64URL
            com.nimbusds.jose.util.Base64URL signature = com.nimbusds.jose.util.Base64URL.encode(signatureBytes);
            // Construct compact serialization: <header>.<payload>.<signature>
            String compact = jwsObject.getHeader().toBase64URL().toString() + "."
                    + jwsObject.getPayload().toBase64URL().toString() + "." + signature;

            // Return a Spring Jwt constructed from compact token and claim set
            java.time.Instant issuedAt;
            Object iatObj = claimMap.get("iat");
            if (iatObj instanceof Number n) {
                issuedAt = java.time.Instant.ofEpochSecond(n.longValue());
            } else if (iatObj instanceof java.time.Instant inst) {
                issuedAt = inst;
            } else {
                issuedAt = java.time.Instant.now();
            }

            java.time.Instant expiresAt;
            Object expObj = claimMap.get("exp");
            if (expObj instanceof Number n2) {
                expiresAt = java.time.Instant.ofEpochSecond(n2.longValue());
            } else if (expObj instanceof java.time.Instant inst2) {
                expiresAt = inst2;
            } else {
                expiresAt = issuedAt.plusSeconds(900);
            }

            return new Jwt(compact, issuedAt, expiresAt, java.util.Map.of("alg", "RS256"), claimMap);

        } catch (Exception e) {
            throw new JwtEncodingException("Failed to build JWS: " + e.getMessage(), e);
        }
    }
}
