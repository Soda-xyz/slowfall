package xyz.soda.slowfall.jump.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.jump.application.JumpService;
import xyz.soda.slowfall.jump.domain.Jump;

@RestController
@RequestMapping("/api/jumps")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class JumpController {
    private final JumpService service;

    public JumpController(JumpService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<JumpDto> createJump(@RequestBody CreateJumpRequest request) {
        try {
            Jump created = service.createJump(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new JumpDto(created.getId(), created.getJumpTime(), created.getAirportId(), created.getAltitudeFeet()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
