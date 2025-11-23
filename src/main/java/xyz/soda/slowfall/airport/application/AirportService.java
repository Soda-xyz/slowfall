package xyz.soda.slowfall.airport.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.airport.api.CreateAirportRequest;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;

@Service
public class AirportService {
    private final AirportRepository repository;

    /**
     * Create a new AirportService.
     *
     * @param repository repository used to persist airports
     */
    public AirportService(AirportRepository repository) {
        this.repository = repository;
    }

    /**
     * Create and persist a new airport from the given request.
     * @param request payload containing ICAO code, name and timezone
     * @return the persisted Airport entity
     */
    @Transactional
    public Airport createAirport(CreateAirportRequest request) {
        Airport airport = new Airport(request.icaoCode(), request.name(), request.timezone());
        return repository.save(airport);
    }

    /**
     * Retrieve all airports.
     * @return list of all Airport entities
     */
    @Transactional(readOnly = true)
    public java.util.List<Airport> listAllAirports() {
        return repository.findAll();
    }
}
