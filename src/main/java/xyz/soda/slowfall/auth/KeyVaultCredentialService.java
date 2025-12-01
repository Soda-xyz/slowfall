package xyz.soda.slowfall.auth;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service that validates a single username/password pair stored as a JSON secret in Key Vault.
 * Expected secret JSON shape: {"username":"alice","passwordHash":"$2a$..."}
 */
@Service
@ConditionalOnBean(SecretClient.class)
public class KeyVaultCredentialService {

    private final SecretClient secretClient;
    private final String secretName;
    private final ObjectMapper mapper = new ObjectMapper();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final Duration ttl;
    // simple cache
    private volatile String cachedJson = null;
    private volatile Instant cachedAt = Instant.EPOCH;

    /**
     * Create the KeyVaultCredentialService.
     *
     * @param secretClient the Azure SecretClient used to read the credentials secret
     * @param secretName   the name of the secret containing credentials JSON
     * @param ttlSeconds   cache TTL for credentials in seconds
     */
    public KeyVaultCredentialService(
            SecretClient secretClient,
            @Value("${app.security.azure.keyvault.credentials-secret-name:slowfall-credentials}") String secretName,
            @Value("${app.security.azure.keyvault.credentials-cache-ttl-seconds:300}") long ttlSeconds) {
        this.secretClient = secretClient;
        this.secretName = secretName;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    /**
     * Refresh cached secret if it is stale.
     */
    private synchronized void refreshIfNeeded() {
        if (cachedJson == null || Instant.now().isAfter(cachedAt.plus(ttl))) {
            KeyVaultSecret s = secretClient.getSecret(secretName);
            if (s != null) {
                cachedJson = s.getValue();
                cachedAt = Instant.now();
            }
        }
    }

    /**
     * Validate the provided username and plain text password against the cached secret.
     *
     * @param username      the username to validate
     * @param plainPassword the plain text password to check
     * @return true if credentials match; false otherwise
     */
    public boolean validate(String username, String plainPassword) {
        try {
            refreshIfNeeded();
            if (cachedJson == null) return false;
            JsonNode root = mapper.readTree(cachedJson);
            String expectedUser = root.path("username").asText(null);
            String hash = root.path("passwordHash").asText(null);
            if (expectedUser == null || hash == null) return false;
            if (!expectedUser.equals(username)) return false;
            return encoder.matches(plainPassword, hash);
        } catch (Exception e) {
            // on error be conservative and fail validation
            return false;
        }
    }
}
