package xyz.soda.slowfall.infra.health;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.actuate.health.Health;

public class KeyVaultHealthIndicatorTest {

    @Test
    public void healthReturnsUnknownWhenNoClientsConfigured() {
        ObjectProvider<KeyClient> emptyKeyProvider = Mockito.mock(ObjectProvider.class);
        when(emptyKeyProvider.getIfAvailable()).thenReturn(null);
        ObjectProvider<SecretClient> emptySecretProvider = Mockito.mock(ObjectProvider.class);
        when(emptySecretProvider.getIfAvailable()).thenReturn(null);

        KeyVaultHealthIndicator hi =
                new KeyVaultHealthIndicator(emptyKeyProvider, emptySecretProvider, "https://kv", "", "");
        Health h = hi.health();
        assertThat(h.getStatus().getCode()).isEqualTo("UNKNOWN");
        assertThat(h.getDetails()).containsEntry("reason", "not-configured");
    }

    @Test
    public void healthDownWhenKeyMissing() {
        KeyClient kc = Mockito.mock(KeyClient.class);
        when(kc.getKey("missing-key")).thenReturn(null);
        ObjectProvider<KeyClient> keyProvider = Mockito.mock(ObjectProvider.class);
        when(keyProvider.getIfAvailable()).thenReturn(kc);
        ObjectProvider<SecretClient> emptySecretProvider = Mockito.mock(ObjectProvider.class);
        when(emptySecretProvider.getIfAvailable()).thenReturn(null);

        KeyVaultHealthIndicator hi =
                new KeyVaultHealthIndicator(keyProvider, emptySecretProvider, "https://kv", "missing-key", "");
        Health h = hi.health();
        assertThat(h.getStatus().getCode()).isEqualTo("DOWN");
        assertThat(h.getDetails()).containsEntry("reason", "no-key");
    }

    @Test
    public void healthUpWhenSecretPresent() {
        SecretClient sc = Mockito.mock(SecretClient.class);
        KeyVaultSecret secret = new KeyVaultSecret("my-secret", "value");
        when(sc.getSecret("sname")).thenReturn(secret);
        ObjectProvider<KeyClient> emptyKeyProvider = Mockito.mock(ObjectProvider.class);
        when(emptyKeyProvider.getIfAvailable()).thenReturn(null);
        ObjectProvider<SecretClient> secretProvider = Mockito.mock(ObjectProvider.class);
        when(secretProvider.getIfAvailable()).thenReturn(sc);

        KeyVaultHealthIndicator hi =
                new KeyVaultHealthIndicator(emptyKeyProvider, secretProvider, "https://kv", "", "sname");
        Health h = hi.health();
        assertThat(h.getStatus().getCode()).isEqualTo("UP");
        assertThat(h.getDetails()).containsEntry("secretName", "sname");
    }
}
