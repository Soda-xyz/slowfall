package xyz.soda.slowfall.jump.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.jump.application.JumpService;
import xyz.soda.slowfall.jump.domain.Jump;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jumps")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class JumpController {
    private final JumpService service;

    /**
     * Create a new instance of {@code JumpController}.
     *
     * @param service the service handling jump operations
     */
    public JumpController(JumpService service) {
        this.service = service;
    }

    /**
     * Create a new jump from the request.
     * @param request payload with jump time, airport and altitude
     * @return ResponseEntity with created JumpDto and HTTP 201, or 400 on bad request
     */
    @PostMapping
    public ResponseEntity<JumpDto> createJump(@Valid @RequestBody CreateJumpRequest request) {
        //try {
            Jump created = service.createJump(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(JumpDto.from(created));
        //} catch (IllegalArgumentException e) {
        //   return ResponseEntity.badRequest().build();
        //}
    }

    /**
     * List all jumps.
     *
     * @return a list of JumpDto for all scheduled jumps
     */
    @GetMapping
    public List<JumpDto> listJumps() {
        return service.listAllJumps().stream().map(JumpDto::from).toList();
    }

    /**
     * Add a skydiver to the specified jump.
     *
     * @param id   the jump id
     * @param body request body map containing key "personId" with the skydiver UUID
     * @return ResponseEntity with 200 on success or 400 on bad request
     */
    @PostMapping("/{id}/skydivers")
    public ResponseEntity<Void> addSkydiver(@PathVariable("id") UUID id, @RequestBody Map<String, UUID> body) {
        UUID personId = body.get("personId");
        if (personId == null) return ResponseEntity.badRequest().build();
        try {
            service.addSkydiverToJump(id, personId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Add a pilot to the specified jump.
     *
     * @param id   the jump id
     * @param body request body map containing key "personId" with the pilot UUID
     * @return ResponseEntity with 200 on success or 400 on bad request
     */
    @PostMapping("/{id}/pilots")
    public ResponseEntity<Void> addPilot(@PathVariable("id") UUID id, @RequestBody Map<String, UUID> body) {
        UUID personId = body.get("personId");
        if (personId == null) return ResponseEntity.badRequest().build();
        try {
            service.addPilotToJump(id, personId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
