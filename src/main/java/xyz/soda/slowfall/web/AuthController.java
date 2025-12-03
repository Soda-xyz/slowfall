package xyz.soda.slowfall.web;

import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.auth.KeyVaultCredentialService;

/**
 * Controller exposing authentication endpoints for issuing access and refresh tokens.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST /auth/login - authenticate with username/password and receive an access token and refresh cookie</li>
 *   <li>POST /auth/refresh - exchange a refresh cookie for a new access token</li>
 * </ul>
 */
@RestController("webAuthController")
@RequestMapping("/web-auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final UserDetailsService userDetailsService;
    // KeyVaultCredentialService is optional: inject only when Key Vault SecretClient is configured
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private KeyVaultCredentialService credentialService;

    private final boolean cookieSecure;
    private final String cookieName;
    private final String cookieSameSite;

    /**
     * Controller constructor wiring required authentication and JWT components.
     *
     * @param authManager authentication manager used to authenticate username/password logins
     * @param jwtEncoder encoder used to sign access and refresh JWTs
     * @param jwtDecoder decoder used to validate refresh tokens
     * @param udsProvider ObjectProvider for UserDetailsService used to load user authorities for token claims
     * @param cookieSecure whether the refresh cookie should be marked Secure
     * @param cookieName the name of the refresh cookie
     * @param cookieSameSite the SameSite attribute to apply to the refresh cookie
     */
    public AuthController(
            AuthenticationManager authManager,
            JwtEncoder jwtEncoder,
            JwtDecoder jwtDecoder,
            ObjectProvider<UserDetailsService> udsProvider,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-secure:false}")
                    boolean cookieSecure,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-name:refresh_token}")
                    String cookieName,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-same-site:Lax}")
                    String cookieSameSite) {
        this.authManager = authManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.userDetailsService = udsProvider.getIfAvailable();
        this.cookieSecure = cookieSecure;
        this.cookieName = cookieName;
        this.cookieSameSite = cookieSameSite;
    }

    /**
     * Authenticate the user and return an access token in the response body. A refresh token
     * is set as an HttpOnly cookie on the response.
     *
     * @param req the authentication request containing username and password
     * @param response the servlet response used to add the refresh cookie
     * @return a ResponseEntity containing a JSON object with an access_token field
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest req, HttpServletResponse response) {
        Authentication auth = null;
        // If KeyVaultCredentialService is present, use it for single-user validation
        boolean validated = false;
        try {
            if (this.credentialService != null) {
                validated = this.credentialService.validate(req.username(), req.password());
            }
        } catch (Exception ignored) {
            validated = false;
        }

        if (validated) {
            // build a minimal Authentication-like subject using username only; authorities will be resolved via UDS
            UserDetails user;
            if (this.userDetailsService != null) {
                user = this.userDetailsService.loadUserByUsername(req.username());
            } else {
                // no UserDetailsService available — create a minimal user with ROLE_USER so flow can continue
                user = User.withUsername(req.username()).password("").roles("USER").build();
            }
            auth = new UsernamePasswordAuthenticationToken(user.getUsername(), null, user.getAuthorities());
        } else {
            // fall back to AuthenticationManager (dev / other flows)
            auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        }

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("slowfall")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(15)))
                .subject(auth.getName())
                .claim(
                        "roles",
                        auth.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toList()))
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();

        JwtClaimsSet refreshClaims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofDays(30)))
                .subject(auth.getName())
                .build();
        String refresh =
                jwtEncoder.encode(JwtEncoderParameters.from(refreshClaims)).getTokenValue();

        ResponseCookie cookie = ResponseCookie.from(this.cookieName, refresh)
                .httpOnly(true)
                .secure(this.cookieSecure)
                .path("/web-auth")
                .maxAge(Duration.ofDays(30))
                .sameSite(this.cookieSameSite)
                .build();

        return ResponseEntity.ok().header("Set-Cookie", cookie.toString()).body(Map.of("access_token", token));
    }

    /**
     * Exchange a refresh token cookie for a new access token.
     *
     * @param refreshToken the refresh token cookie value (can be null)
     * @param body optional JSON body (fallback) containing {"refresh_token": "..."}
     * @return 200 with a JSON map containing access_token on success, or 401 on failure
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            @RequestBody(required = false) Map<String, String> body) {
        // If cookie is absent, allow fallback to a JSON body (cookieless clients)
        if (refreshToken == null && body != null) {
            try {
                String maybe = body.get("refresh_token");
                if (maybe != null && !maybe.isBlank()) {
                    refreshToken = maybe;
                }
            } catch (Exception ignored) {
                // ignore and fall through to the 401 below
            }
        }
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            Jwt parsed = jwtDecoder.decode(refreshToken);
            String username = parsed.getSubject();
            UserDetails user;
            if (this.userDetailsService != null) {
                user = this.userDetailsService.loadUserByUsername(username);
            } else {
                user = User.withUsername(username).password("").roles("USER").build();
            }

            Instant now = Instant.now();
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuedAt(now)
                    .expiresAt(now.plus(Duration.ofMinutes(15)))
                    .subject(username)
                    .claim(
                            "roles",
                            user.getAuthorities().stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .collect(Collectors.toList()))
                    .build();
            String newToken =
                    jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            return ResponseEntity.ok(Map.of("access_token", newToken));
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    /**
     * Simple record representing an authentication request payload.
     *
     * @param username the username to authenticate
     * @param password the user's password
     */
    public record AuthRequest(String username, String password) {}
}
