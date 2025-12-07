package xyz.soda.slowfall.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public Filter pseudoAuthFilter(
            @Value("${PSEUDO_AUTH_ENABLED:false}") boolean pseudoEnabled,
            @Value("${app.security.dev-username:}") String devUsername,
            @Value("${app.security.dev-password:}") String devPassword) {
        return new PseudoAuthFilter(pseudoEnabled, devUsername, devPassword);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, Filter pseudoAuthFilter) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(CsrfConfigurer::disable)
            .addFilterBefore(pseudoAuthFilter, BasicAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/protected/**").authenticated()
                .anyRequest().permitAll() // allow unauthenticated access in local/dev
            );

        return http.build();
    }

    // Private nested filter implementation to validate Basic auth against runtime env values when enabled.
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
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            if (enabled) {
                try {
                    String authHeader = request.getHeader("Authorization");
                    if (StringUtils.hasText(authHeader) && authHeader.toLowerCase().startsWith("basic ")) {
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

        private boolean constantTimeEquals(String a, String b) {
            if (a == null || b == null) return false;
            if (a.length() != b.length()) return false;
            int result = 0;
            for (int i = 0; i < a.length(); i++) {
                result |= a.charAt(i) ^ b.charAt(i);
            }
            return result == 0;
        }
    }
}
