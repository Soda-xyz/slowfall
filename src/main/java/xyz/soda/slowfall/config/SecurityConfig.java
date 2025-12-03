package xyz.soda.slowfall.config;

import com.azure.security.keyvault.keys.KeyClient;
import com.azure.security.keyvault.keys.models.JsonWebKey;
import com.azure.security.keyvault.keys.models.KeyVaultKey;
import com.azure.security.keyvault.secrets.SecretClient;
import com.nimbusds.jose.jwk.RSAKey;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import xyz.soda.slowfall.infra.security.DevBypassAuthFilter;

/**
 * Spring Security configuration for the application.
 *
 * Key security decision: do NOT create any ephemeral RSA signing key in non-dev profiles.
 * - Dev-only ephemeral RSA JWK is provided under the 'dev' profile (helps local testing).
 * - In production, a Key Vault key or secret MUST be configured (via app.security.azure.keyvault.*)
 *   so that a stable RSAKey bean is available. If it's missing, the application will fail-fast.
 */
@Configuration
@EnableConfigurationProperties(CorsProperties.class)
@SuppressWarnings("unused")
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

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
     * Disable automatic servlet registration of the DevBypassAuthFilter bean.
     * When a Filter is declared as a bean, Spring Boot will register it as a
     * servlet Filter. We want this filter to be active only inside the Spring
     * Security filter chain (registered with http.addFilterBefore), so disable
     * the servlet registration to avoid duplicate or out-of-order execution.
     */
    @Bean
    public FilterRegistrationBean<DevBypassAuthFilter> disableDevBypassRegistration(DevBypassAuthFilter filter) {
        FilterRegistrationBean<DevBypassAuthFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
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
            DevBypassAuthFilter devBypassAuthFilter,
            Environment env,
            @Value("${app.security.allowed-group-id:}") String allowedGroupId)
            throws Exception {
        // Ensure Spring Security uses the application's CorsConfigurationSource so CORS headers
        // are applied before security decisions. This registers the CorsFilter inside the
        // security filter chain.
        http.cors(Customizer.withDefaults());

        // Determine if we're running in 'dev' profile (allow a safe fallback there)
        boolean isDev = java.util.Arrays.asList(env.getActiveProfiles()).contains("dev");

        // If allowedGroupId wasn't provided, fail fast in non-dev; otherwise use a dev fallback
        if (allowedGroupId == null || allowedGroupId.isBlank()) {
            if (!isDev) {
                throw new IllegalStateException("Missing required configuration: 'app.security.allowed-group-id'");
            } else {
                // development convenience: use the previously provisioned test group id so local dev doesn't break
                allowedGroupId = "1dea5e51-d15e-4081-9722-46da3bfdee79";
                log.warn(
                        "app.security.allowed-group-id not set; using development fallback group id {}",
                        allowedGroupId);
            }
        }

        // Conditionally disable CSRF: keep CSRF enabled during 'dev' so tests expecting
        // CSRF protection (MockMvc + csrf()) behave correctly. For non-dev (prod/test) we
        // use stateless APIs and disable CSRF. In dev we enable CSRF but ignore anonymous requests
        // (so unauthenticated requests return 401 instead of being rejected with 403 due to missing CSRF token).
        isDev = java.util.Arrays.asList(env.getActiveProfiles()).contains("dev");
        if (!isDev) {
            http.csrf(AbstractHttpConfigurer::disable);
        } else {
            // Enforce CSRF only for the dedicated test endpoints under /api/protected/**.
            // Ignore CSRF for all other requests so regular API endpoints behave as stateless
            // (no CSRF token required), while tests that exercise CSRF protection can target
            // /api/protected/** and use MockMvc csrf() helpers.
            http.csrf(csrf -> csrf.ignoringRequestMatchers(r -> {
                String u = r.getRequestURI();
                return u == null || !u.startsWith("/api/protected");
            }));
        }

        // CORS is handled by the CorsConfigurationSource bean registered above; avoid deprecated HttpSecurity.cors()

        // Read dev-bypass flag to optionally relax authentication for API endpoints
        boolean devBypass = Boolean.parseBoolean(env.getProperty("app.security.dev-bypass", "false"));

        String finalAllowedGroupId = allowedGroupId;
        http.authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS).permitAll();
                    auth.requestMatchers("/auth/**", "/web-auth/**", "/actuator/health", "/.well-known/**").permitAll();
                    // Require membership in the configured AAD group or allow a dev ROLE_USER for local/testing.
                    String requiredAuthority = "ROLE_" + finalAllowedGroupId;
                    auth.anyRequest().hasAuthority(requiredAuthority);
                })
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // httpBasic is applied conditionally below instead of being unconditionally disabled
                // .httpBasic(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new org.springframework.security.oauth2.server.resource.web
                                .BearerTokenAuthenticationEntryPoint()))
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)));

        // Add dev-bypass filter before the AnonymousAuthenticationFilter so it can inject
        // a development authentication for protected test endpoints when appropriate.
        // The filter itself will skip applying the bypass when test helpers or real
        // authentication is present (checks for Authorization header, SecurityContext,
        // and certain request attributes), so this placement is safe for test scenarios.
        http.addFilterBefore(devBypassAuthFilter, AnonymousAuthenticationFilter.class);

        // Conditionally enable HTTP Basic only in development-like profiles or when explicitly allowed via property.
        boolean isPseudo = java.util.Arrays.asList(env.getActiveProfiles()).contains("pseudo");
        boolean allowHttpBasic =
                isDev || isPseudo || Boolean.parseBoolean(env.getProperty("app.security.allow-http-basic", "false"));
        if (allowHttpBasic) {
            http.httpBasic(Customizer.withDefaults());
        } else {
            http.httpBasic(AbstractHttpConfigurer::disable);
        }

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
    @org.springframework.context.annotation.Profile({"dev", "pseudo"})
    public UserDetailsService users(
            PasswordEncoder encoder,
            @Value("${app.security.dev-username:dev}") String devUsername,
            @Value("${app.security.dev-password:devpass}") String devPassword) {
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
     * This change accepts an ObjectProvider<UserDetailsService> so the application can start
     * even when no UserDetailsService is configured (for example in 'prod' when Key Vault
     * credentials are not provided). In that case we return an AuthenticationManager that
     * always fails authentication with a clear message instead of failing bean creation.
     *
     * @param udsProvider provider for {@link UserDetailsService}
     * @param encoder the {@link PasswordEncoder} used to verify credentials
     * @return an {@link AuthenticationManager}
     */
    @Bean
    public AuthenticationManager authenticationManager(
            ObjectProvider<UserDetailsService> udsProvider, PasswordEncoder encoder) {
        UserDetailsService uds = udsProvider.getIfAvailable();
        if (uds == null) {
            // No user details service configured; return an AuthenticationManager that always fails
            return authentication -> {
                throw new BadCredentialsException(
                        "Username/password authentication is not configured on this instance");
            };
        }
        // Use the constructor that accepts a UserDetailsService to avoid deprecated API usage
        DaoAuthenticationProvider p = new DaoAuthenticationProvider(uds);
        p.setPasswordEncoder(encoder);
        return new ProviderManager(p);
    }

    /**
     * Production UserDetailsService backed by credentials stored in Azure Key Vault.
     *
     * <p>This bean is active for the 'prod' profile and only created when
     * `app.security.azure.keyvault.user-secret-name` is set. The secret may be stored
     * in two supported formats:
     * <ul>
     *   <li>JSON: {"username":"<user>","password":"<pass>"}</li>
     *   <li>plain: "username:password"</li>
     * </ul>
     * <p>
     * Note: This is a temporary convenience to allow the application to read a single
     * login from Key Vault for production. It's not recommended for long-term
     * multi-user production authentication. Consider replacing with a database-backed
     * UserDetailsService or an external identity provider.
     */
    @Bean
    @org.springframework.context.annotation.Profile("prod")
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "user-secret-name")
    public UserDetailsService keyVaultUserDetailsService(
            com.azure.core.credential.TokenCredential credential,
            PasswordEncoder encoder,
            Environment env,
            @Value("${app.security.azure.keyvault.vault-url:}") String vaultUrl) {
        if (vaultUrl == null || vaultUrl.trim().isEmpty()) {
            throw new IllegalStateException(
                    "app.security.azure.keyvault.vault-url must be set to read user credentials from Key Vault");
        }

        String userSecretName = env.getProperty("app.security.azure.keyvault.user-secret-name");
        if (userSecretName == null || userSecretName.isBlank()) {
            userSecretName = env.getProperty("app.security.azure.keyvault.credentials-secret-name");
        }
        if (userSecretName == null || userSecretName.isBlank()) {
            throw new IllegalStateException(
                    "Neither 'app.security.azure.keyvault.user-secret-name' nor 'app.security.azure.keyvault.credentials-secret-name' is set; cannot read user credentials from Key Vault");
        }

        SecretClient secretClient = new com.azure.security.keyvault.secrets.SecretClientBuilder()
                .vaultUrl(vaultUrl)
                .credential(credential)
                .buildClient();

        String secretValue;
        try {
            secretValue = secretClient.getSecret(userSecretName).getValue();
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to read user secret '" + userSecretName + "' from Key Vault: " + e.getMessage(), e);
        }

        String username = null;
        String password = null;
        String passwordHash = null;

        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            var node = om.readTree(secretValue);
            if (node.has("username")) {
                username = node.get("username").asText();
            }
            if (node.has("password")) {
                password = node.get("password").asText();
            }
            if (node.has("passwordHash")) {
                passwordHash = node.get("passwordHash").asText();
            }
        } catch (Exception ignored) {
        }

        if ((username == null || (password == null && passwordHash == null)) && secretValue != null) {
            java.util.regex.Pattern userPattern = java.util.regex.Pattern.compile(
                    "username\\s*[:=]\\s*\"?([^,}\"]+)\"?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Pattern passPattern = java.util.regex.Pattern.compile(
                    "password\\s*[:=]\\s*\"?([^,}\"]+)\"?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Pattern passHashPattern = java.util.regex.Pattern.compile(
                    "passwordHash\\s*[:=]\\s*\"?([^,}\"]+)\"?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher mu = userPattern.matcher(secretValue);
            if (mu.find()) {
                username = mu.group(1).trim();
            }
            java.util.regex.Matcher mph = passHashPattern.matcher(secretValue);
            if (mph.find()) {
                passwordHash = mph.group(1).trim();
            }
            java.util.regex.Matcher mp = passPattern.matcher(secretValue);
            if (mp.find()) {
                password = mp.group(1).trim();
            }

            if ((username == null || (password == null && passwordHash == null))
                    && !secretValue.contains("{")
                    && secretValue.contains(":")) {
                int idx = secretValue.indexOf(':');
                username = secretValue.substring(0, idx).trim();
                password = secretValue.substring(idx + 1).trim();
            }
        }

        if (username == null
                || username.isEmpty()
                || ((password == null || password.isEmpty()) && (passwordHash == null || passwordHash.isEmpty()))) {
            throw new IllegalStateException(
                    "User secret '" + userSecretName
                            + "' in Key Vault does not contain valid credentials (expected JSON with username/password or 'username:password' or a passwordHash)");
        }

        String storedPassword;
        if (passwordHash != null && !passwordHash.isEmpty()) {
            storedPassword = passwordHash;
        } else {
            storedPassword = encoder.encode(password);
        }

        var uds = new InMemoryUserDetailsManager();
        uds.createUser(User.withUsername(username)
                .password(storedPassword)
                .roles("USER")
                .build());
        return uds;
    }

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
    @Profile("dev")
    @ConditionalOnMissingBean(RSAKey.class)
    public RSAKey rsaJwk() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        var kp = kpg.generateKeyPair();
        RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
        RSAPrivateKey priv = (RSAPrivateKey) kp.getPrivate();
        return new RSAKey.Builder(pub)
                .privateKey(priv)
                .keyID(UUID.randomUUID().toString())
                .build();
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
     * @param secretClient the {@link SecretClient} used to fetch the secret
     * @return an {@link RSAKey} constructed from the private key loaded from Azure Key Vault
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "secret-name")
    public RSAKey rsaKeyFromAzureKeyVault(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.secret-name}") String secretName,
            SecretClient secretClient)
            throws Exception {
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
     * @param keyClient the {@link KeyClient} used to fetch the key
     * @return an {@link RSAKey} constructed from the key loaded from Azure Key Vault
     */
    @Bean
    @Primary
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
    public RSAKey rsaKeyFromAzureKeyVaultKey(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name}") String keyName,
            KeyClient keyClient)
            throws Exception {
        KeyVaultKey key;
        try {
            key = keyClient.getKey(keyName);
        } catch (Exception e) {
            String msg = String.format(
                    "Failed to read key '%s' from Key Vault '%s': %s. Ensure the key exists and the application identity has 'keys/get' permission.",
                    keyName, vaultUrl, e.getMessage());
            log.error(msg);
            throw new IllegalStateException(msg, e);
        }
        if (key == null) {
            String msg = String.format(
                    "Key Vault returned no key for name '%s' in vault '%s'. Confirm the key exists and property 'app.security.azure.keyvault.key-name' is correct.",
                    keyName, vaultUrl);
            log.error(msg);
            throw new IllegalStateException(msg);
        }
        if (key.getKey() == null) {
            String msg = String.format(
                    "Key Vault key '%s' in vault '%s' exists but contains no JsonWebKey (null). Ensure the key is an RSA key and not an unsupported type.",
                    keyName, vaultUrl);
            log.error(msg);
            throw new IllegalStateException(msg);
        }
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
     * @param keyClient the {@link KeyClient} used to build the CryptographyClient
     * @param credential the {@link com.azure.core.credential.TokenCredential} used to authenticate to Key Vault
     * @return a configured {@link JwtEncoder}
     */
    @Bean
    @ConditionalOnProperty(prefix = "app.security.azure.keyvault", name = "key-name")
    public JwtEncoder keyVaultJwtEncoder(
            @Value("${app.security.azure.keyvault.vault-url}") String vaultUrl,
            @Value("${app.security.azure.keyvault.key-name}") String keyName,
            KeyClient keyClient,
            com.azure.core.credential.TokenCredential credential) {
        // Build CryptographyClient from injected KeyClient (use key id)
        KeyVaultKey key;
        try {
            key = keyClient.getKey(keyName);
        } catch (Exception e) {
            String msg = String.format(
                    "Failed to read key '%s' from Key Vault '%s': %s. Ensure the key exists and the application identity has 'keys/get' permission.",
                    keyName, vaultUrl, e.getMessage());
            log.error(msg);
            throw new IllegalStateException(msg, e);
        }
        if (key == null) {
            String msg = String.format(
                    "Key Vault returned no key for name '%s' in vault '%s'. Confirm the key exists and property 'app.security.azure.keyvault.key-name' is correct.",
                    keyName, vaultUrl);
            log.error(msg);
            throw new IllegalStateException(msg);
        }
        if (key.getId() == null || key.getId().isBlank()) {
            String msg = String.format(
                    "Key Vault key '%s' in vault '%s' does not have a valid key identifier (kid). Confirm the key is enabled and accessible.",
                    keyName, vaultUrl);
            log.error(msg);
            throw new IllegalStateException(msg);
        }
        com.azure.security.keyvault.keys.cryptography.CryptographyClient cryptoClient =
                new com.azure.security.keyvault.keys.cryptography.CryptographyClientBuilder()
                        .keyIdentifier(key.getId())
                        .credential(credential)
                        .buildClient();
        try {
            if (key.getKey() == null) {
                String msg = String.format(
                        "Key Vault key '%s' in vault '%s' exists but contains no JsonWebKey (null). Ensure the key is an RSA key and not an unsupported type.",
                        keyName, vaultUrl);
                log.error(msg);
                throw new IllegalStateException(msg);
            }
            RSAKey rsa = RSAKey.parse(key.getKey().toJsonString());
            return new xyz.soda.slowfall.auth.KeyVaultJwtSigner(cryptoClient, rsa);
        } catch (IllegalStateException e) {
            throw e; // rethrow our own clearer IllegalStateExceptions
        } catch (Exception e) {
            String msg = "Failed to parse JWK from Key Vault key: " + e.getMessage();
            log.error(msg, e);
            throw new IllegalStateException(msg, e);
        }
    }

    @Bean
    @ConditionalOnMissingBean(org.springframework.security.oauth2.jwt.JwtEncoder.class)
    public org.springframework.security.oauth2.jwt.JwtEncoder jwtEncoder(RSAKey rsaJwk) {
        // Build a JWKSource from the RSA JWK and return a NimbusJwtEncoder.
        com.nimbusds.jose.jwk.JWKSet jwkSet = new com.nimbusds.jose.jwk.JWKSet(rsaJwk);
        com.nimbusds.jose.jwk.source.ImmutableJWKSet<com.nimbusds.jose.proc.SecurityContext> jwkSource =
                new com.nimbusds.jose.jwk.source.ImmutableJWKSet<>(jwkSet);
        return new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(jwkSource);
    }

    @Bean
    @ConditionalOnMissingBean(org.springframework.security.oauth2.jwt.JwtDecoder.class)
    public JwtDecoder jwtDecoder(RSAKey rsaJwk) throws Exception {
        // Use the RSA public key from the provided JWK for decoding
        RSAPublicKey pub = rsaJwk.toRSAPublicKey();
        return org.springframework.security.oauth2.jwt.NimbusJwtDecoder.withPublicKey(pub)
                .build();
    }

    /**
     * Convert a Jwt into an Authentication token mapping the `groups` claim to authorities.
     * This maps each group GUID to an authority named `ROLE_<groupId>` so we can use familiar
     * ROLE checks in security rules.
     */
    @Bean
    public Converter<Jwt, AbstractAuthenticationToken> jwtAuthConverter() {
        // Custom converter: combine authorities from the 'groups' claim (AAD group GUIDs)
        // and the application's 'roles' claim (used by /auth/login). For 'groups' we
        // prefix values with ROLE_ to form authorities like ROLE_<group-guid>. For 'roles'
        // we accept the values as-is (they may already be prefixed like ROLE_USER).
        return jwt -> {
            java.util.List<String> groupClaims = jwt.getClaimAsStringList("groups");
            java.util.List<String> roleClaims = jwt.getClaimAsStringList("roles");

            java.util.Set<org.springframework.security.core.GrantedAuthority> authorities = new java.util.HashSet<>();
            if (groupClaims != null) {
                for (String g : groupClaims) {
                    if (g != null && !g.isBlank()) {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + g));
                    }
                }
            }
            if (roleClaims != null) {
                for (String r : roleClaims) {
                    if (r != null && !r.isBlank()) {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(r));
                    }
                }
            }

            // Fallback: also allow the standard JwtGrantedAuthoritiesConverter to pick up 'scope' / 'scp' if present
            JwtGrantedAuthoritiesConverter fallback = new JwtGrantedAuthoritiesConverter();
            authorities.addAll(fallback.convert(jwt));

            // Build authentication token with the combined authorities
            return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    jwt.getSubject(), "n/a", authorities.stream().toList());
        };
    }
}
