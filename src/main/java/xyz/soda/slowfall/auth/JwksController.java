package xyz.soda.slowfall.auth;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Exposes the application's public keys as a JWKS endpoint so other services can fetch
 * the public JWK(s) without needing Key Vault access.
 * <p>
 * Endpoint: GET /.well-known/jwks.json
 */
@RestController
@RequestMapping("/.well-known")
public class JwksController {

    private final RSAKey rsaKey;

    public JwksController(RSAKey rsaKey) {
        this.rsaKey = rsaKey;
    }

    @GetMapping(path = "/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> jwks() {
        JWKSet set = new JWKSet(rsaKey.toPublicJWK());
        return ResponseEntity.ok(set.toJSONObject());
    }
}
