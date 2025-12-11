package xyz.soda.slowfall.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter;
import org.springframework.lang.NonNull;

@SuppressWarnings("unused")
@Configuration
public class SecurityConfig {

    /**
     * Creates a pseudo authentication filter used in local/dev environments when PSEUDO_AUTH_ENABLED is true.
     * This filter validates Basic auth credentials against runtime environment values {@code app.security.dev-username}
     * and {@code app.security.dev-password}.
     *
     * @param pseudoEnabled whether pseudo auth is enabled via the PSEUDO_AUTH_ENABLED env var
     * @param devUsername the runtime dev username to validate against
     * @param devPassword the runtime dev password to validate against
     * @return a configured Filter that applies pseudo authentication when enabled
     */
    @Bean
    public Filter pseudoAuthFilter(
            @Value("${PSEUDO_AUTH_ENABLED:false}") boolean pseudoEnabled,
            @Value("${app.security.dev-username:}") String devUsername,
            @Value("${app.security.dev-password:}") String devPassword) {
        return new PseudoAuthFilter(pseudoEnabled, devUsername, devPassword);
    }

    /**
     * Configures the Spring Security filter chain for the application.
     * - Enables CORS, disables CSRF, and inserts the pseudo auth filter before basic auth.
     * - Protects paths under /api/protected/** and permits other requests (useful for local/dev flows).
     *
     * @param http the HttpSecurity builder provided by Spring Security
     * @param pseudoAuthFilter the pseudo authentication filter to insert into the chain
     * @return the configured SecurityFilterChain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, Filter pseudoAuthFilter) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(CsrfConfigurer::disable)
                // Allow pages from the same origin to be framed (H2 console uses frames)
                .headers(headers -> headers.addHeaderWriter(
                        new XFrameOptionsHeaderWriter(XFrameOptionsHeaderWriter.XFrameOptionsMode.SAMEORIGIN)
                ))
                .addFilterBefore(pseudoAuthFilter, BasicAuthenticationFilter.class)
                .authorizeHttpRequests(
                        auth -> auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                .permitAll()
                                .requestMatchers("/api/protected/**")
                                .authenticated()
                                .anyRequest()
                                .permitAll()
                        );

        return http.build();
    }

    /**
     * Private nested filter implementation to validate Basic auth against runtime env values when enabled.
     */
    private static class PseudoAuthFilter extends OncePerRequestFilter implements Filter {
        private final boolean enabled;
        private final String username;
        private final String password;

        PseudoAuthFilter(boolean enabled, String username, String password) {
            this.enabled = enabled;
            this.username = username == null ? "" : username;
            this.password = password == null ? "" : password;
        }

        @Override
        protected void doFilterInternal(
                @NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
                throws ServletException, IOException {
            if (enabled) {
                try {
                    String authHeader = request.getHeader("Authorization");
                    if (StringUtils.hasText(authHeader)
                            && authHeader.toLowerCase().startsWith("basic ")) {
                        String base64 = authHeader.substring(6).trim();
                        String decoded = new String(Base64.getDecoder().decode(base64), StandardCharsets.UTF_8);
                        int idx = decoded.indexOf(':');
                        if (idx > -1) {
                            String reqUser = decoded.substring(0, idx);
                            String reqPass = decoded.substring(idx + 1);
                            if (constantTimeEquals(reqUser, username) && constantTimeEquals(reqPass, password)) {
                                setAuth(reqUser);
                            }
                        }
                    }
                } catch (Exception ex) {
                    // swallow - do not block the request
                }
            }

            filterChain.doFilter(request, response);
        }

        private void setAuth(String user) {
            List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            Authentication auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        private boolean constantTimeEquals(String left, String right) {
            if (left == null || right == null) return false;
            if (left.length() != right.length()) return false;
            int result = 0;
            for (int i = 0; i < left.length(); i++) {
                result |= left.charAt(i) ^ right.charAt(i);
            }
            return result == 0;
        }
    }
}
