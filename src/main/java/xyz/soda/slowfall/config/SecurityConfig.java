package xyz.soda.slowfall.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import xyz.soda.slowfall.infra.security.DevBypassAuthFilter;

/**
 * Spring Security configuration for the application.
 *
 * <p>This configuration class declares beans used by Spring Security including:
 * <ul>
 *   <li>a development bypass filter (DevBypassAuthFilter),</li>
 *   <li>the main {@link SecurityFilterChain},</li>
 *   <li>an in-memory {@link UserDetailsService} for basic username/password auth,</li>
 *   <li>a {@link PasswordEncoder} and {@link AuthenticationManager} for authentication,
 *   <li>JWT-related beans (RSA key, JWKSource, {@link JwtEncoder}, {@link JwtDecoder}),</li>
 *   <li>and a {@link Converter} that maps a {@link org.springframework.security.oauth2.jwt.Jwt}
 *       to an {@link AbstractAuthenticationToken} with granted authorities.</li>
 * </ul>
 *
 * <p>Notes:
 * <ul>
 *   <li>RSA key generation here is ephemeral and intended for development only. In production,
 *       provide a persistent key via a secure store (Vault, KMS, etc.) and publish a JWKS endpoint.</li>
 *   <li>The dev bypass filter is registered before {@link AnonymousAuthenticationFilter} so it can
 *       populate the SecurityContext during local development when enabled.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    /**
     * Create the development bypass filter.
     *
     * <p>The filter will inspect environment settings to determine whether to short-circuit
     * authentication during local development. See {@link DevBypassAuthFilter} for behavior.
     *
     * @param env Spring {@link Environment} used to read dev-mode flags
     * @return an instance of {@link DevBypassAuthFilter}
     */
    @Bean
    public DevBypassAuthFilter devBypassAuthFilter(Environment env) {
        return new DevBypassAuthFilter(env);
    }

    /**
     * Configure the main Spring Security filter chain.
     *
     * <p>This config:
     * <ul>
     *   <li>disables CSRF (stateless API),</li>
     *   <li>permits access to authentication endpoints and health check,</li>
     *   <li>requires authentication for other requests,</li>
     *   <li>uses stateless session management,</li>
     *   <li>enables HTTP Basic for simple username/password auth, and</li>
     *   <li>configures JWT-based resource server support using the supplied converter.</li>
     * </ul>
     *
     * @param http the HttpSecurity builder
     * @param jwtAuthConverter converter that maps a Jwt to an AbstractAuthenticationToken
     * @param devBypassAuthFilter optional dev-bypass filter to insert before anonymous auth
     * @return the built {@link SecurityFilterChain}
     * @throws Exception if building the security chain fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> jwtAuthConverter,
            DevBypassAuthFilter devBypassAuthFilter)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.requestMatchers("/auth/**", "/actuator/health")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(Customizer.withDefaults())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)));

        // Add dev-bypass filter before the AnonymousAuthenticationFilter so we can populate the SecurityContext
        http.addFilterBefore(devBypassAuthFilter, AnonymousAuthenticationFilter.class);

        return http.build();
    }

    /**
     * In-memory user details service used for simple username/password authentication.
     *
     * <p>This creates a single user with username "dev" and password "devpass" (encoded).
     * Intended for local development and integration tests only.
     *
     * @param encoder the {@link PasswordEncoder} used to encode the in-memory user's password
     * @return a configured {@link UserDetailsService}
     */
    @Bean
    public UserDetailsService users(PasswordEncoder encoder) {
        // in-memory test user for simple username/password login
        var uds = new InMemoryUserDetailsManager();
        uds.createUser(User.withUsername("dev")
                .password(encoder.encode("devpass"))
                .roles("USER")
                .build());
        return uds;
    }

    /**
     * Password encoder bean.
     *
     * @return a {@link BCryptPasswordEncoder} instance
     * @see <a href="https://docs.spring.io/spring-security/reference/passwords/index.html">Spring Security - Password Storage</a>
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Build an {@link AuthenticationManager} backed by a {@link DaoAuthenticationProvider} and the
     * provided {@link UserDetailsService}.
     *
     * @param uds the {@link UserDetailsService} to load users
     * @param encoder the {@link PasswordEncoder} used to verify credentials
     * @return an {@link AuthenticationManager}
     */
    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder encoder) {
        // Use the constructor that accepts a UserDetailsService to avoid deprecated API usage
        DaoAuthenticationProvider p = new DaoAuthenticationProvider(uds);
        p.setPasswordEncoder(encoder);
        return new ProviderManager(p);
    }

    // Generate an ephemeral RSA key pair for JWT signing in dev.
    // In production, replace this with a key loaded from Vault / KMS and expose JWKS.

    /**
     * Generate an ephemeral RSA JWK for signing JWTs.
     *
     * <p>Intended for development and test environments only. Production deployments should
     * provide a stable key via an external key management system and publish a JWKS endpoint.
     *
     * @return an {@link RSAKey} containing a newly-generated 2048-bit RSA keypair
     * @throws Exception if the key generator cannot be initialized
     */
    @Bean
    public RSAKey rsaJwk() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
        RSAPrivateKey priv = (RSAPrivateKey) kp.getPrivate();
        return new RSAKey.Builder(pub)
                .privateKey(priv)
                .keyID(java.util.UUID.randomUUID().toString())
                .build();
    }

    /**
     * Create a JWKSource backed by the public part of the provided {@link RSAKey}.
     *
     * @param rsaKey the RSA JWK produced by {@link #rsaJwk()}
     * @return a {@link JWKSource} exposing the public JWK set
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        JWKSet set = new JWKSet(rsaKey.toPublicJWK());
        return new ImmutableJWKSet<>(set);
    }

    /**
     * Create a Nimbus {@link JwtEncoder} backed by the supplied {@link JWKSource}.
     *
     * @param jwkSource the source of JWKs used for signing
     * @return a configured {@link JwtEncoder}
     */
    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    /**
     * Create a Nimbus {@link JwtDecoder} that verifies tokens using the provided RSA public key.
     *
     * @param rsaKey RSA key containing the public key to verify JWTs
     * @return a configured {@link JwtDecoder}
     * @throws Exception if obtaining the public key fails
     */
    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws Exception {
        RSAPublicKey pub = rsaKey.toRSAPublicKey();
        return NimbusJwtDecoder.withPublicKey(pub).build();
    }

    /**
     * Converter that maps a JWT to an {@link AbstractAuthenticationToken} and extracts granted
     * authorities from a "roles" claim, if present.
     *
     * <p>The converter expects the JWT to contain a claim named "roles" that is an array of
     * strings; each string will be turned into a {@link SimpleGrantedAuthority}.
     *
     * @return a configured JWT-to-Authentication converter
     */
    @Bean
    public Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
        conv.setJwtGrantedAuthoritiesConverter(jwt -> {
            Object rolesObj = jwt.getClaims().get("roles");
            if (rolesObj instanceof List<?> rolesList) {
                return rolesList.stream()
                        .map(Object::toString)
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());
            }
            return Collections.emptyList();
        });
        return conv;
    }
}
