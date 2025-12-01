package xyz.soda.slowfall.infra.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Status;

public class KeyVaultHealthCheckTest {

    @Test
    void healthUpWhenKeyPresent() {
        KeyClient kc = mock(KeyClient.class);
        KeyVaultKey kvk = mock(KeyVaultKey.class);
        when(kc.getKey("my-key")).thenReturn(kvk);
        when(kvk.getId()).thenReturn("https://kv/keys/my-key/1");

        KeyVaultHealthCheck chk = new KeyVaultHealthCheck(kc, "https://kv", "my-key", true);
        var health = chk.health();
        assertEquals(Status.UP, health.getStatus());
        assertEquals("https://kv/keys/my-key/1", health.getDetails().get("keyId"));
    }

    @Test
    void healthDownWhenKeyMissing() {
        KeyClient kc = mock(KeyClient.class);
        when(kc.getKey("missing")).thenReturn(null);

        KeyVaultHealthCheck chk = new KeyVaultHealthCheck(kc, "https://kv", "missing", false);
        var health = chk.health();
        assertEquals(Status.DOWN, health.getStatus());
        assertEquals("key-not-found", health.getDetails().get("error"));
    }
}
