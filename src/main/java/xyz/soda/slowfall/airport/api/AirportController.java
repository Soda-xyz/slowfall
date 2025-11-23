package xyz.soda.slowfall.airport.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.airport.application.AirportService;
import xyz.soda.slowfall.airport.domain.Airport;

import java.util.List;

@RestController
@RequestMapping("/api/airports")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class AirportController {

    private final AirportService service;

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
    public ResponseEntity<AirportDto> createAirport(@RequestBody CreateAirportRequest request) {
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
