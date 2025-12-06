package xyz.soda.slowfall.config;

import com.azure.core.credential.TokenCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.KeyClientBuilder;
import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.SecretClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * Exposes Azure Key Vault clients as Spring beans so other components can reuse them.
 */
@Configuration
@Profile("!dev")
public class KeyVaultConfig {

    private static final Logger log = LoggerFactory.getLogger(KeyVaultConfig.class);

    /**
     * Provides a TokenCredential bean for authenticating to Azure Key Vault.
     *
     * @param clientId     the client ID for Azure AD application
     * @param clientSecret the client secret for Azure AD application
     * @param tenantId     the tenant ID for Azure AD
     * @return a TokenCredential instance for authenticating to Azure services
     */
    @Bean
    @Primary
    public TokenCredential keyVaultCredential(
            @Value("${azure.client.id:}") String clientId,
            @Value("${azure.client.secret:}") String clientSecret,
            @Value("${azure.tenant.id:}") String tenantId) {
        if (clientId != null
                && !clientId.isEmpty()
                && clientSecret != null
                && !clientSecret.isEmpty()
                && tenantId != null
                && !tenantId.isEmpty()) {
            return new ClientSecretCredentialBuilder()
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .tenantId(tenantId)
                    .build();
        }
        return new DefaultAzureCredentialBuilder().build();
    }

    /**
     * Build a SecretClient for the given vault URL using the provided credential.
     *
     * @param vaultUrl   the Key Vault URL
     * @param credential the TokenCredential used to authenticate to Key Vault
     * @return a configured SecretClient
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "secret-name")
    public SecretClient secretClient(
            @Value("${app.security.azure.keyvault.vault-url:}") String vaultUrl, TokenCredential credential) {
        // Fallback to environment variable used by App Service/CI if property isn't provided
        if (vaultUrl == null || vaultUrl.isBlank()) {
            String envVault = System.getenv("AZ_KEYVAULT_VAULT_URL");
            if (envVault != null && !envVault.isBlank()) {
                log.info("Using AZ_KEYVAULT_VAULT_URL from environment for SecretClient");
                vaultUrl = envVault;
            }
        } else {
            log.debug("Using property 'app.security.azure.keyvault.vault-url' for SecretClient");
        }
        validateVaultUrl(vaultUrl, "secret client");
        return new SecretClientBuilder()
                .vaultUrl(vaultUrl)
                .credential(credential)
                .buildClient();
    }

    /**
     * Build a KeyClient for the given vault URL using the provided credential.
     *
     * @param vaultUrl   the Key Vault URL
     * @param credential the TokenCredential used to authenticate to Key Vault
     * @return a configured KeyClient
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
    public KeyClient keyClient(
            @Value("${app.security.azure.keyvault.vault-url:}") String vaultUrl, TokenCredential credential) {
        // Fallback to environment variable used by App Service/CI if property isn't provided
        if (vaultUrl == null || vaultUrl.isBlank()) {
            String envVault = System.getenv("AZ_KEYVAULT_VAULT_URL");
            if (envVault != null && !envVault.isBlank()) {
                log.info("Using AZ_KEYVAULT_VAULT_URL from environment for KeyClient");
                vaultUrl = envVault;
            }
        } else {
            log.debug("Using property 'app.security.azure.keyvault.vault-url' for KeyClient");
        }
        validateVaultUrl(vaultUrl, "key client");
        return new KeyClientBuilder().vaultUrl(vaultUrl).credential(credential).buildClient();
    }

    private void validateVaultUrl(String vaultUrl, String clientType) {
        if (vaultUrl == null || vaultUrl.trim().isEmpty()) {
            throw new IllegalStateException("Key Vault " + clientType
                    + " requested but app.security.azure.keyvault.vault-url is not set or empty");
        }
        try {
            java.net.URL url = new java.net.URL(vaultUrl);
            String protocol = url.getProtocol();
            if (!"https".equalsIgnoreCase(protocol) && !"http".equalsIgnoreCase(protocol)) {
                throw new IllegalStateException(
                        "Key Vault " + clientType + " vault-url must use http(s) protocol: " + vaultUrl);
            }
        } catch (java.net.MalformedURLException e) {
            throw new IllegalStateException("Invalid Key Vault " + clientType + " vault-url: " + vaultUrl, e);
        }
    }
}
