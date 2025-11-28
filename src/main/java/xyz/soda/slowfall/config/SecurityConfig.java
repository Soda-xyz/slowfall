package xyz.soda.slowfall.config;

import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.KeyClientBuilder;
import com.azure.security.keyvault.keys.models.JsonWebKey;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.SecretClientBuilder;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import xyz.soda.slowfall.auth.KeyVaultJwtSigner;
import xyz.soda.slowfall.infra.security.DevBypassAuthFilter;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.Certificate;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Spring Security configuration for the application.
 *
 * <p>This configuration class declares beans used by Spring Security, including:
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
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

    /**
     * Create the development bypass filter.
     *
     * <p>The filter will inspect environment settings to determine whether to short-circuit
     * authentication during local development. See {@link DevBypassAuthFilter} for behaviour.
     *
     * @param env Spring {@link Environment} used to read dev-mode flags
     * @return an instance of {@link DevBypassAuthFilter}
     */
    @Bean
    public DevBypassAuthFilter devBypassAuthFilter(Environment env) {
        return new DevBypassAuthFilter(env);
    }

    /**
     * CORS configuration source used by Spring Security's CORS support.
     *
     * <p>This builds the allowed origins from {@link CorsProperties} so they can be configured
     * per-profile (application-dev.properties vs. application.properties).
     *
     * @param props typed CORS properties bound from configuration
     * @return a configured {@link CorsConfigurationSource}
     */
    @Bean
    @Primary
    public CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = props.getAllowedOrigins();
        // If the property was provided via an environment variable (comma-separated)
        // it might bind to a list containing a single empty string when the env var
        // is unset or empty. Filter blank entries to avoid that and treat the result
        // as 'not configured' so we fall back to dev defaults.
        if (origins != null) {
            origins = origins.stream()
                    .filter(o -> o != null && !o.trim().isEmpty())
                    .collect(Collectors.toList());
        }
        if (origins == null || origins.isEmpty()) {
            // default to common local dev origins so developers running the frontend on
            // different dev ports (5173, 5174, 3000) won't be blocked. Production should
            // provide explicit values via app.cors.allowed-origins.
            origins = List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:3000");
        }
        // If any configured origin contains a wildcard, register as origin patterns so
        // spring will match them; otherwise register exact origins so the framework will
        // echo the explicit origin in Access-Control-Allow-Origin (required when
        // allowCredentials is true).
        boolean containsWildcard = origins.stream().anyMatch(o -> o.contains("*"));
        if (containsWildcard) {
            configuration.setAllowedOriginPatterns(origins);
        } else {
            configuration.setAllowedOrigins(origins);
        }
        // IMPORTANT: allow credentialed responses when the frontend sends credentials
        // (cookies or fetch with credentials: 'include'). The browser requires
        // Access-Control-Allow-Credentials: true to expose credentialed responses to JS.
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configure the main Spring Security filter chain.
     *
     * <p>This config:
     * <ul>
     *   <li>disables CSRF (stateless API),</li>
     *   <li>permits access to authentication endpoints and health check.</</li>
     *   <li>requires authentication for other requests.</li>
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
        // Ensure Spring Security uses the application's CorsConfigurationSource so CORS headers
        // are applied before security decisions. This registers the CorsFilter inside the
        // security filter chain.
        http.cors(Customizer.withDefaults());

        // CORS is handled by the CorsConfigurationSource bean registered above; avoid deprecated HttpSecurity.cors()

        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.OPTIONS)
                        .permitAll() // allow preflight
                        .requestMatchers("/auth/**", "/actuator/health", "/.well-known/**")
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
     * <p>This creates a single user with the username "dev" and password "devpass" (encoded).
     * Intended for local development and integration tests only.
     *
     * @param encoder the {@link PasswordEncoder} used to encode the in-memory user's password
     * @param devUsername the username for the development user (from properties)
     * @param devPassword the password for the development user (from properties)
     * @return a configured {@link UserDetailsService}
     */
    @Bean
    @org.springframework.context.annotation.Profile("dev")
    public UserDetailsService users(
            PasswordEncoder encoder,
            @org.springframework.beans.factory.annotation.Value("${app.security.dev-username:dev}") String devUsername,
            @org.springframework.beans.factory.annotation.Value("${app.security.dev-password:devpass}")
                    String devPassword) {
        // in-memory test user for simple username/password login (dev only)
        var uds = new InMemoryUserDetailsManager();
        uds.createUser(User.withUsername(devUsername)
                .password(encoder.encode(devPassword))
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
     * @return an {@link RSAKey} containing a newly generated 2048-bit RSA keypair
     * @throws Exception if the key generator cannot be initialised
     */
    @Bean
    @org.springframework.context.annotation.Profile("dev")
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
     * Load an RSA key from a keystore provided via properties. This bean is conditional on the
     * property 'app.security.jks.path' being set and will be used in production to provide
     * a stable RSA key instead of the dev ephemeral key.
     * Expected properties:
     *   app.security.jks.path=/path/to/keystore.jks
     *   app.security.jks.password=keystorePassword
     *   app.security.jks.alias=keyAlias
     *   app.security.jks.key-password=keyPassword (optional)
     *
     * @param keystorePath path to the JKS keystore file
     * @param keystorePassword password for the keystore
     * @param keyAlias alias of the private key entry inside the keystore
     * @param keyPassword optional password for the key (if different from keystore password)
     * @return an {@link RSAKey} constructed from the keystore's private key and certificate
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.jks", name = "path")
    public RSAKey rsaKeyFromKeystore(
            @Value("${app.security.jks.path}") String keystorePath,
            @Value("${app.security.jks.password}") String keystorePassword,
            @Value("${app.security.jks.alias}") String keyAlias,
            @Value("${app.security.jks.key-password:}") String keyPassword)
            throws Exception {
        try (InputStream in = Files.newInputStream(Paths.get(keystorePath))) {
            KeyStore ks = KeyStore.getInstance("JKS");
            ks.load(in, keystorePassword.toCharArray());
            Key key = ks.getKey(
                    keyAlias,
                    (keyPassword == null || keyPassword.isEmpty())
                            ? keystorePassword.toCharArray()
                            : keyPassword.toCharArray());
            if (!(key instanceof PrivateKey)) {
                throw new IllegalStateException("Key for alias '" + keyAlias + "' is not a PrivateKey");
            }
            Certificate cert = ks.getCertificate(keyAlias);
            RSAPublicKey pub = (RSAPublicKey) cert.getPublicKey();
            RSAPrivateKey priv = (RSAPrivateKey) key;
            return new RSAKey.Builder(pub)
                    .privateKey(priv)
                    .keyID(UUID.randomUUID().toString())
                    .build();
        }
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
    @ConditionalOnMissingBean(JwtEncoder.class)
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    /**
     * Create a Nimbus {@link JwtDecoder} that verifies tokens using the provided RSA public key.
     *
     * @param rsaKey RSA key containing the public key to verify JWTs
     * @return a configured {@link JwtDecoder}
     * @throws Exception if getting the public key fails
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

    /**
     * Load an RSA key from Azure Key Vault using the Secrets client.
     *
     * <p>This bean is conditional on the property 'app.security.azure.keyvault.secret-name' being
     * set, and is intended for production use to load a stable RSA key.
     * Expected properties:
     * app.security.azure.keyvault.vault-url=https://<your-key-vault>.vault.azure.net/
     * app.security.azure.keyvault.secret-name=<your-secret-name>
     *
     * @param vaultUrl   the URL of the Azure Key Vault
     * @param secretName the name of the secret containing the PEM-encoded private key
     * @return an {@link RSAKey} constructed from the private key loaded from Azure Key Vault
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "secret-name")
    public RSAKey rsaKeyFromAzureKeyVault(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.secret-name}") String secretName)
            throws Exception {
        // Build a SecretClient that uses DefaultAzureCredential (managed identity, env vars, etc.)
        SecretClient secretClient = new SecretClientBuilder()
                .vaultUrl(vaultUrl)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();

        String pem = secretClient.getSecret(secretName).getValue();
        // Expect PEM containing -----BEGIN PRIVATE KEY----- base64 -----END PRIVATE KEY-----
        String base64 = pem.replaceAll("-----BEGIN (.*)-----", "")
                .replaceAll("-----END (.*)-----", "")
                .replaceAll("\r", "")
                .replaceAll("\n", "")
                .trim();

        byte[] keyBytes = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
        var kf = java.security.KeyFactory.getInstance("RSA");
        PrivateKey priv = kf.generatePrivate(keySpec);

        // Try to derive the public key from the private CRT key parameters
        if (!(priv instanceof RSAPrivateCrtKey crt)) {
            throw new IllegalStateException(
                    "Private key is not an RSA private CRT key; cannot derive public key. Store a public key or JWK alongside the private key.");
        }
        RSAPublicKeySpec pubSpec = new RSAPublicKeySpec(crt.getModulus(), crt.getPublicExponent());
        RSAPublicKey pub = (RSAPublicKey) kf.generatePublic(pubSpec);

        return new RSAKey.Builder(pub)
                .privateKey((RSAPrivateKey) priv)
                .keyID(UUID.randomUUID().toString())
                .build();
    }

    /**
     * Load an RSA key from Azure Key Vault using the Keys client.
     *
     * <p>This bean is conditional on the property 'app.security.azure.keyvault.key-name' being
     * set, and is intended for production use to load a stable RSA key.
     * Expected properties:
     * app.security.azure.keyvault.vault-url=https://<your-key-vault>.vault.azure.net/
     * app.security.azure.keyvault.key-name=<your-key-name>
     *
     * @param vaultUrl the URL of the Azure Key Vault
     * @param keyName  the name of the key to load
     * @return an {@link RSAKey} constructed from the key loaded from Azure Key Vault
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
    public RSAKey rsaKeyFromAzureKeyVaultKey(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name}") String keyName)
            throws Exception {
        KeyClient keyClient = new KeyClientBuilder()
                .vaultUrl(vaultUrl)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();
        KeyVaultKey key = keyClient.getKey(keyName);
        JsonWebKey jwk = key.getKey();
        // Parse JsonWebKey into Nimbus RSAKey
        return RSAKey.parse(jwk.toJsonString());
    }

    /**
     * Create a JwtEncoder that uses Azure Key Vault to sign JWTs.
     *
     * <p>This encoder is configured with the vault URL and key name, and uses the
     * KeyVaultJwtSigner to sign tokens.
     *
     * @param vaultUrl the URL of the Azure Key Vault
     * @param keyName  the name of the key used for signing
     * @return a configured {@link JwtEncoder}
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
    public JwtEncoder keyVaultJwtEncoder(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name}") String keyName) {
        return new KeyVaultJwtSigner(vaultUrl, keyName);
    }
}
