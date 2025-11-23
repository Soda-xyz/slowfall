package xyz.soda.slowfall.craft.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.craft.application.CraftService;

@RestController
@RequestMapping("/api/crafts")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class CraftController {
    private final CraftService service;

    /**
     * Create a new instance of {@code CraftController}.
     *
     * @param service the service handling craft operations
     */
    public CraftController(CraftService service) {
        this.service = service;
    }

    /**
     * Create a new craft from the request.
     * @param request payload with craft details
     * @return a ResponseEntity containing the created CraftDto with HTTP 201, or 400 on bad request
     */
    @PostMapping
    public ResponseEntity<CraftDto> createCraft(@Valid @RequestBody CreateCraftRequest request) {
        try {
            var created = service.createCraft(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new CraftDto(
                            created.getId(),
                            created.getName(),
                            created.getRegistrationNumber(),
                            created.getCapacityWeight(),
                            created.getCapacityPersons()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Return a list of all crafts.
     *
     * @return list of CraftDto
     */
    @GetMapping
    public java.util.List<CraftDto> listCrafts() {
        return service.listAllCrafts().stream().map(CraftDto::from).toList();
    }
}
