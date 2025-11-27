package xyz.soda.slowfall.web;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final UserDetailsService userDetailsService;

    public AuthController(AuthenticationManager authManager, JwtEncoder jwtEncoder, JwtDecoder jwtDecoder, UserDetailsService uds) {
        this.authManager = authManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.userDetailsService = uds;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest req, HttpServletResponse response) {
        Authentication auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("slowfall")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(15)))
                .subject(auth.getName())
                .claim("roles", auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();

        // refresh token (signed JWT for simplicity here) - longer lived
        JwtClaimsSet refreshClaims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofDays(30)))
                .subject(auth.getName())
                .build();
        String refresh = jwtEncoder.encode(JwtEncoderParameters.from(refreshClaims)).getTokenValue();

        ResponseCookie cookie = ResponseCookie.from("refresh_token", refresh)
                .httpOnly(true)
                .secure(false) // set true when running behind TLS in prod
                .path("/auth")
                .maxAge(Duration.ofDays(30))
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok().header("Set-Cookie", cookie.toString()).body(Map.of("access_token", token));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@CookieValue(name = "refresh_token", required = false) String refreshToken) {
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
                    .claim("roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                    .build();
            String newToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            return ResponseEntity.ok(Map.of("access_token", newToken));
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    public record AuthRequest(String username, String password) {
    }
}
