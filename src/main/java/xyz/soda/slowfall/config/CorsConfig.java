package xyz.soda.slowfall.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    /**
     * Reads spring.cors.allowed-origins from application-dev.properties.
     * Example value: {@code http://localhost:5173,http://localhost:3000}.
     */
    @Value("${spring.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsProperty;

    /**
     * Parses the configured allowed origins string into a cleaned list.
     *
     * @return a list of allowed origin URLs parsed from the configuration property
     */
    private List<String> parseOrigins() {
        return Arrays.stream(allowedOriginsProperty.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Provides a CORS configuration source using the configured allowed origins.
     *
     * @return a CorsConfigurationSource configured with the allowed origins and standard CORS settings
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cors = new CorsConfiguration();
        List<String> origins = parseOrigins();
        cors.setAllowedOrigins(origins); // exact origins required when allowCredentials=true
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cors.setAllowedHeaders(List.of("*"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    /**
     * Optional: register a CorsFilter so CORS headers are added early in the filter chain.
     *
     * @return a configured CorsFilter instance.
     */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource) corsConfigurationSource();
        return new CorsFilter(source);
    }
}
