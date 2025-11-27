package xyz.soda.slowfall.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
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

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    @Bean
    public DevBypassAuthFilter devBypassAuthFilter(Environment env) {
        return new DevBypassAuthFilter(env);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, Converter<Jwt, AbstractAuthenticationToken> jwtAuthConverter, DevBypassAuthFilter devBypassAuthFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/actuator/health").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(Customizer.withDefaults())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)));

        // Add dev-bypass filter before the AnonymousAuthenticationFilter so we can populate the SecurityContext
        http.addFilterBefore(devBypassAuthFilter, AnonymousAuthenticationFilter.class);

        return http.build();
    }

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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder encoder) {
        // Use the constructor that accepts a UserDetailsService to avoid deprecated API usage
        DaoAuthenticationProvider p = new DaoAuthenticationProvider(uds);
        p.setPasswordEncoder(encoder);
        return new ProviderManager(p);
    }

    // Generate an ephemeral RSA key pair for JWT signing in dev.
    // In production, replace this with a key loaded from Vault / KMS and expose JWKS.
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

    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        JWKSet set = new JWKSet(rsaKey.toPublicJWK());
        return new ImmutableJWKSet<>(set);
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws Exception {
        RSAPublicKey pub = rsaKey.toRSAPublicKey();
        return NimbusJwtDecoder.withPublicKey(pub).build();
    }

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
