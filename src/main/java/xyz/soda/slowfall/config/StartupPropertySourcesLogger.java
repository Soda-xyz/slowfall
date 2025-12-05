package xyz.soda.slowfall.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.PropertySource;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.Arrays;
import org.springframework.lang.NonNull;

/**
 * Startup listeners to help debug property source origins for Key Vault related properties.
 * <p>
 * - Logs which PropertySource supplies Key Vault configuration keys during early startup.
 * - Masks sensitive values (secrets/passwords) while still exposing enough to identify the value.
 */
public class StartupPropertySourcesLogger implements ApplicationListener<ApplicationEvent> {

    private static final Logger log = LoggerFactory.getLogger(StartupPropertySourcesLogger.class);

    private static final String[] KEYS = new String[] {
            "app.security.azure.keyvault.vault-url",
            "app.security.azure.keyvault.key-name",
            "app.security.azure.keyvault.secret-name",
            "app.security.azure.keyvault.user-secret-name",
            "app.security.azure.keyvault.credentials-secret-name",
            // common env-style variants used in deployments
            "AZ_KEYVAULT_VAULT_URL",
            "AZ_KEYVAULT_KEY_NAME"
    };

    @Override
    public void onApplicationEvent(@NonNull ApplicationEvent genericEvent) {
        try {
            if (genericEvent instanceof ApplicationEnvironmentPreparedEvent envEvent) {
                ConfigurableEnvironment env = envEvent.getEnvironment();
                log.info("Startup property sources diagnostic: scanning for Key Vault properties...");

                Map<String, List<String>> sourceToProps = new TreeMap<>();

                for (PropertySource<?> ps : env.getPropertySources()) {
                    List<String> found = new ArrayList<>();
                    for (String key : KEYS) {
                        Object v = null;
                        try {
                            v = ps.getProperty(key);
                        } catch (Exception ignored) {
                            // some property sources may throw; ignore and continue
                        }
                        if (v != null) {
                            found.add(key + "=" + maskFor(key, v.toString()));
                        }
                    }
                    if (!found.isEmpty()) {
                        sourceToProps.put(ps.getName(), found);
                    } else if (ps instanceof EnumerablePropertySource<?> eps) {
                        // fallback: check env-style keys in enumerable property sources
                        Set<String> names = Arrays.stream(eps.getPropertyNames()).collect(Collectors.toSet());
                        for (String key : KEYS) {
                            if (names.contains(key)) {
                                Object v = eps.getProperty(key);
                                if (v != null) {
                                    sourceToProps.computeIfAbsent(ps.getName(), k -> new ArrayList<>())
                                            .add(key + "=" + maskFor(key, v.toString()));
                                }
                            }
                        }
                    }
                }

                if (sourceToProps.isEmpty()) {
                    // Nothing found in property sources; log environment variables separately
                    log.info("No Key Vault properties found in PropertySources. Checking system environment variables...");
                    Map<String,String> envmap = System.getenv().entrySet().stream()
                            .filter(e -> List.of(KEYS).contains(e.getKey()))
                            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
                    if (envmap.isEmpty()) {
                        log.info("No Key Vault-related environment variables found (checked keys: {})", String.join(",", KEYS));
                    } else {
                        for (Map.Entry<String,String> e : envmap.entrySet()) {
                            log.info("ENV {}={}", e.getKey(), maskFor(e.getKey(), e.getValue()));
                        }
                    }
                    return;
                }

                log.info("Found Key Vault related properties in the following PropertySources (values masked where appropriate):");
                for (Map.Entry<String, List<String>> e : sourceToProps.entrySet()) {
                    log.info("  PropertySource: {} -> {}", e.getKey(), String.join(", ", e.getValue()));
                }
            } else if (genericEvent instanceof ApplicationFailedEvent failedEvent) {
                log.error("Application failed to start: {}", failedEvent.getException().toString());
                // Also attempt to log env variables as a last resort when context isn't available
                Map<String,String> envmap = System.getenv().entrySet().stream()
                        .filter(e -> List.of(KEYS).contains(e.getKey()))
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
                if (!envmap.isEmpty()) {
                    log.error("Key Vault related environment variables present (masked):");
                    for (Map.Entry<String,String> e : envmap.entrySet()) {
                        log.error("  {}={}", e.getKey(), maskFor(e.getKey(), e.getValue()));
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("StartupPropertySourcesLogger failed to handle event: {}", ex.getMessage(), ex);
        }
    }

    private static String maskFor(String key, String val) {
        if (val == null) return "(null)";
        if (key.toLowerCase().contains("secret") || key.toLowerCase().contains("password")
                || key.toLowerCase().contains("credentials") || key.toLowerCase().contains("token")) {
            return mask(val);
        }
        // For long-ish secret-like values (like connection strings) mask partially
        if (val.length() > 64) return mask(val);
        // For names and urls show them, but shorten long urls
        if (key.toLowerCase().contains("vault-url")) {
            return val;
        }
        if (key.toLowerCase().contains("key-name") || key.toLowerCase().contains("secret-name")
                || key.toLowerCase().contains("user-secret")) {
            // show short hint without revealing full secret names
            return val.length() > 32 ? val.substring(0, 8) + "..." + val.substring(val.length()-8) : val;
        }
        return val;
    }

    private static String mask(String v) {
        if (v == null) return "(null)";
        int len = v.length();
        if (len <= 4) return "****";
        int shown = Math.min(4, Math.max(1, len / 6));
        String start = v.substring(0, shown);
        String end = v.substring(Math.max(shown, len - shown));
        return start + "****" + end;
    }
}
