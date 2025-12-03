package xyz.soda.slowfall.infra.health;

import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import com.azure.security.keyvault.secrets.SecretClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * HealthIndicator that checks basic availability of a Key Vault key or secret used by the application.
 *
 * This bean is only created when `app.security.azure.keyvault.vault-url` is set (so it won't run in
 * simple local dev without Key Vault configured).
 */
@Component
@ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "vault-url")
public class KeyVaultHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(KeyVaultHealthIndicator.class);

    private final ObjectProvider<KeyClient> keyClientProvider;
    private final ObjectProvider<SecretClient> secretClientProvider;
    private final String vaultUrl;
    private final String keyName;
    private final String secretName;

    public KeyVaultHealthIndicator(
            ObjectProvider<KeyClient> keyClientProvider,
            ObjectProvider<SecretClient> secretClientProvider,
            @Value("${app.security.azure.keyvault.vault-url:}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name:}") String keyName,
            @Value("${app.security.azure.keyvault.secret-name:}") String secretName) {
        this.keyClientProvider = keyClientProvider;
        this.secretClientProvider = secretClientProvider;
        this.vaultUrl = vaultUrl;
        this.keyName = keyName;
        this.secretName = secretName;
    }

    @Override
    @NonNull
    public Health health() {
        // Prefer key client (Keys API) if configured
        KeyClient kc = keyClientProvider.getIfAvailable();
        if (kc != null && keyName != null && !keyName.isBlank()) {
            try {
                KeyVaultKey key = kc.getKey(keyName);
                if (key == null) {
                    String msg = String.format("Key Vault at %s returned no key for name '%s'", vaultUrl, keyName);
                    log.warn(msg);
                    return Health.down().withDetail("reason", "no-key").withDetail("keyName", keyName).build();
                }
                if (key.getKey() == null) {
                    String msg = String.format("Key Vault at %s returned key '%s' but key material is missing (no JWK)", vaultUrl, keyName);
                    log.warn(msg);
                    return Health.down().withDetail("reason", "no-jwk").withDetail("keyName", keyName).build();
                }
                return Health.up().withDetail("keyName", keyName).build();
            } catch (Exception e) {
                String msg = String.format("Failed to reach Key Vault keys API at %s for key '%s': %s", vaultUrl, keyName, e.getMessage());
                log.error(msg, e);
                return Health.down(e).withDetail("reason", "exception").withDetail("message", e.getMessage()).build();
            }
        }

        // Fallback to secret client if configured and secretName is provided
        SecretClient sc = secretClientProvider.getIfAvailable();
        if (sc != null && secretName != null && !secretName.isBlank()) {
            try {
                var secret = sc.getSecret(secretName);
                if (secret == null || secret.getValue() == null || secret.getValue().isBlank()) {
                    String msg = String.format("Key Vault at %s returned secret '%s' but value is empty", vaultUrl, secretName);
                    log.warn(msg);
                    return Health.down().withDetail("reason", "empty-secret").withDetail("secretName", secretName).build();
                }
                return Health.up().withDetail("secretName", secretName).build();
            } catch (Exception e) {
                String msg = String.format("Failed to reach Key Vault secrets API at %s for secret '%s': %s", vaultUrl, secretName, e.getMessage());
                log.error(msg, e);
                return Health.down(e).withDetail("reason", "exception").withDetail("message", e.getMessage()).build();
            }
        }

        // No key or secret configured to check
        String msg = "No Key Vault key-name or secret-name configured for health check";
        log.info(msg);
        return Health.unknown().withDetail("reason", "not-configured").build();
    }
}

