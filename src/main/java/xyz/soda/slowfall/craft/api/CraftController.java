package xyz.soda.slowfall.craft.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.craft.application.CraftService;

@RestController
@RequestMapping("/api/crafts")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class CraftController {
    private final CraftService service;

    public CraftController(CraftService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CraftDto> createCraft(@RequestBody CreateCraftRequest request) {
        try {
            var created = service.createCraft(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new CraftDto(created.getId(), created.getName(),
                    created.getRegistrationNumber(), created.getCapacityWeight(), created.getCapacityPersons()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
