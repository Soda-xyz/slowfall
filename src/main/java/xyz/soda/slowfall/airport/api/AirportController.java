package xyz.soda.slowfall.airport.api;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.airport.application.AirportService;
import xyz.soda.slowfall.airport.domain.Airport;

@RestController
@RequestMapping("/api/airports")
public class AirportController {

    private final AirportService service;

    // Note: CORS is handled globally by the application's CorsConfigurationSource
    // and per-profile settings (see application-dev.properties). Remove per-controller
    // @CrossOrigin to centralize CORS policy for dev vs. prod environments.

    /**
     * Create a new AirportController.
     *
     * @param service the airport service used to handle airport operations
     */
    public AirportController(AirportService service) {
        this.service = service;
    }

    /**
     * Create a new airport from the given request.
     * @param request the request payload containing airport data
     * @return a ResponseEntity with the created AirportDto and HTTP 201, or 400 on bad request
     */
    @PostMapping
    public ResponseEntity<AirportDto> createAirport(@Valid @RequestBody CreateAirportRequest request) {
        try {
            Airport created = service.createAirport(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(AirportDto.from(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Return a list of all airports.
     * @return list of AirportDto
     */
    @GetMapping
    public List<AirportDto> listAirports() {
        return service.listAllAirports().stream().map(AirportDto::from).toList();
    }
}
