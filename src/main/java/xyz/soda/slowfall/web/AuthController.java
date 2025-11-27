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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing authentication endpoints for issuing access and refresh tokens.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST /auth/login - authenticate with username/password and receive an access token and refresh cookie</li>
 *   <li>POST /auth/refresh - exchange a refresh cookie for a new access token</li>
 * </ul>
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final UserDetailsService userDetailsService;

    private final boolean cookieSecure;
    private final String cookieName;
    private final String cookieSameSite;

    /**
     * Controller constructor wiring required authentication and JWT components.
     *
     * @param authManager authentication manager used to authenticate username/password logins
     * @param jwtEncoder encoder used to sign access and refresh JWTs
     * @param jwtDecoder decoder used to validate refresh tokens
     * @param uds user details service used to load user authorities for token claims
     * @param cookieSecure whether the refresh cookie should be marked Secure
     * @param cookieName the name of the refresh cookie
     * @param cookieSameSite the SameSite attribute to apply to the refresh cookie
     */
    public AuthController(
            AuthenticationManager authManager,
            JwtEncoder jwtEncoder,
            JwtDecoder jwtDecoder,
            UserDetailsService uds,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-secure:false}")
                    boolean cookieSecure,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-name:refresh_token}")
                    String cookieName,
            @org.springframework.beans.factory.annotation.Value("${app.security.cookie-same-site:Lax}")
                    String cookieSameSite) {
        this.authManager = authManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.userDetailsService = uds;
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
        Authentication auth =
                authManager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));

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
                .path("/auth")
                .maxAge(Duration.ofDays(30))
                .sameSite(this.cookieSameSite)
                .build();

        return ResponseEntity.ok().header("Set-Cookie", cookie.toString()).body(Map.of("access_token", token));
    }

    /**
     * Exchange a refresh token cookie for a new access token.
     *
     * @param refreshToken the refresh token cookie value (can be null)
     * @return 200 with a JSON map containing access_token on success, or 401 on failure
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            Jwt parsed = jwtDecoder.decode(refreshToken);
            String username = parsed.getSubject();
            var user = userDetailsService.loadUserByUsername(username);

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
