package xyz.soda.slowfall.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Minimal controller used only for security tests: provides a protected endpoint
 * at /api/protected/resource that requires authentication and respects CSRF for POST.
 */
@RestController
@RequestMapping("/api/protected")
public class ProtectedResourceController {

    @GetMapping("/resource")
    public ResponseEntity<String> get() {
        return ResponseEntity.ok("ok");
    }

    @PostMapping("/resource")
    public ResponseEntity<String> post(@RequestBody(required = false) String body) {
        return ResponseEntity.ok("ok");
    }
}

