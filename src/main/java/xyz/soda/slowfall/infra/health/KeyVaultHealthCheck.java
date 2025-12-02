package xyz.soda.slowfall.infra.health;

import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Startup check and HealthIndicator that verifies Azure Key Vault key availability.
 * Active when 'app.security.azure.keyvault.key-name' is configured.
 */
@Component
@Profile("!dev")
@ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
public class KeyVaultHealthCheck implements ApplicationRunner, HealthIndicator {

    private final String vaultUrl;
    private final String keyName;
    private final KeyClient keyClient;
    private final boolean failFast;

    /**
     * Production constructor used by Spring. Builds a KeyClient using DefaultAzureCredential.
     *
     * @param vaultUrl the Key Vault URL
     * @param keyName the name of the key to check
     * @param failFast whether to throw on startup when key is unavailable
     */
    @Autowired
    public KeyVaultHealthCheck(
            KeyClient keyClient,
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name}") String keyName,
            @Value("${app.security.azure.keyvault.fail-fast:true}") boolean failFast) {
        this.vaultUrl = vaultUrl;
        this.keyName = keyName;
        this.failFast = failFast;
        this.keyClient = keyClient;
    }

    private KeyVaultKey fetchKey() {
        return keyClient.getKey(keyName);
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Fail fast on startup if the key cannot be retrieved, or log and continue if configured
        KeyVaultKey key = null;
        try {
            key = fetchKey();
        } catch (Exception ex) {
            if (failFast) {
                throw new IllegalStateException(
                        "Azure Key Vault access failed for key '" + keyName + "' at " + vaultUrl, ex);
            }
            // else continue; health() will report DOWN
            return;
        }

        if (key == null && failFast) {
            throw new IllegalStateException("Azure Key Vault key '" + keyName + "' not found at " + vaultUrl);
        }
    }

    @Override
    public Health health() {
        try {
            KeyVaultKey key = fetchKey();
            return (key != null)
                    ? Health.up().withDetail("keyId", key.getId()).build()
                    : Health.down().withDetail("error", "key-not-found").build();
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }
}
