package xyz.soda.slowfall.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed configuration properties for CORS settings.
 *
 * <p>Bound from properties with the prefix 'app.cors'. Use in application-*.properties
 * to provide environment-specific origins.
 */
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    /**
     * Allowed origin patterns (supports wildcard patterns). Example: [<a href="http://localhost:5173">...</a>]
     */
    private List<String> allowedOrigins;

    /**
     * Return the allowed origin patterns configured for CORS.
     *
     * @return a list of allowed origin patterns (can be null if not configured)
     */
    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    /**
     * Set the allowed origin patterns to be used for CORS.
     *
     * @param allowedOrigins the list of allowed origin patterns
     */
    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
}
