/**
 * Placeholder file header; actual content below.
 */
package xyz.soda.slowfall.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller that implements a minimal cookie-less authentication API suitable for
 * production when using JWTs. It provides endpoints to exchange username/password for
 * a short-lived access token and a longer-lived refresh token, and to refresh the
 * access token using a valid refresh token.
 *
 * <p>This controller intentionally keeps server-side state minimal: refresh tokens are
 * implemented as JWTs and validated via the existing {@code JwtDecoder}. For a stricter
 * production setup consider storing refresh token identifiers server-side and rotating
 * tokens on use.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;

    /**
     * Create a new AuthController.
     *
     * @param authenticationManager used to authenticate username/password
     * @param jwtEncoder            used to sign JWTs
     * @param jwtDecoder            used to validate incoming JWTs (refresh tokens)
     */
    public AuthController(AuthenticationManager authenticationManager, JwtEncoder jwtEncoder, JwtDecoder jwtDecoder) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    /**
     * Exchange username/password for an access token and refresh token.
     *
     * @param req the login request payload
     * @return 200 with tokens on success, or 401 on authentication failure
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            UsernamePasswordAuthenticationToken authReq =
                    new UsernamePasswordAuthenticationToken(req.username, req.password);
            Authentication auth = authenticationManager.authenticate(authReq);

            String username = auth.getName();
            List<String> roles = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            Instant now = Instant.now();
            Instant accessExp = now.plus(15, ChronoUnit.MINUTES);
            Instant refreshExp = now.plus(7, ChronoUnit.DAYS);

            JwtClaimsSet accessClaims = JwtClaimsSet.builder()
                    .issuer("slowfall")
                    .issuedAt(now)
                    .expiresAt(accessExp)
                    .subject(username)
                    .claim("roles", roles)
                    .claim("type", "access")
                    .build();

            String accessToken =
                    jwtEncoder.encode(JwtEncoderParameters.from(accessClaims)).getTokenValue();

            JwtClaimsSet refreshClaims = JwtClaimsSet.builder()
                    .issuer("slowfall")
                    .issuedAt(now)
                    .expiresAt(refreshExp)
                    .subject(username)
                    .claim("type", "refresh")
                    .build();

            String refreshToken =
                    jwtEncoder.encode(JwtEncoderParameters.from(refreshClaims)).getTokenValue();

            TokenResponse resp = new TokenResponse(
                    accessToken, accessExp.getEpochSecond(), refreshToken, refreshExp.getEpochSecond());
            return ResponseEntity.ok(resp);
        } catch (org.springframework.security.core.AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_credentials"));
        }
    }

    /**
     * Exchange a refresh token for a new access token. The refresh token is validated
     * using the configured {@code JwtDecoder} and must contain a claim "type":"refresh".
     *
     * @param req the refresh request containing the refresh token
     * @return 200 with a new access token on success, or 401 if the token is invalid
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        try {
            var jwt = jwtDecoder.decode(req.refreshToken);
            Object type = jwt.getClaims().get("type");
            if (type == null || !"refresh".equals(type.toString())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_token"));
            }

            String username = jwt.getSubject();
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) jwt.getClaims().getOrDefault("roles", List.of());

            Instant now = Instant.now();
            Instant accessExp = now.plus(15, ChronoUnit.MINUTES);

            JwtClaimsSet accessClaims = JwtClaimsSet.builder()
                    .issuer("slowfall")
                    .issuedAt(now)
                    .expiresAt(accessExp)
                    .subject(username)
                    .claim("roles", roles)
                    .claim("type", "access")
                    .build();

            String accessToken =
                    jwtEncoder.encode(JwtEncoderParameters.from(accessClaims)).getTokenValue();
            return ResponseEntity.ok(
                    Map.of("accessToken", accessToken, "accessTokenExpiresAt", accessExp.getEpochSecond()));
        } catch (org.springframework.security.oauth2.jwt.JwtException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_refresh_token"));
        }
    }

    /**
     * Request payload for login requests.
     */
    public static class LoginRequest {
        public String username;
        public String password;

        public LoginRequest() {
        }

        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }
    }

    /**
     * Response payload containing tokens and expiry information (epoch seconds).
     */
    public static class TokenResponse {
        public String accessToken;
        public long accessTokenExpiresAt;
        public String refreshToken;
        public long refreshTokenExpiresAt;

        public TokenResponse(
                String accessToken, long accessTokenExpiresAt, String refreshToken, long refreshTokenExpiresAt) {
            this.accessToken = accessToken;
            this.accessTokenExpiresAt = accessTokenExpiresAt;
            this.refreshToken = refreshToken;
            this.refreshTokenExpiresAt = refreshTokenExpiresAt;
        }
    }

    /**
     * Request payload for refresh requests.
     */
    public static class RefreshRequest {
        public String refreshToken;

        public RefreshRequest() {
        }

        public RefreshRequest(String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }
}
