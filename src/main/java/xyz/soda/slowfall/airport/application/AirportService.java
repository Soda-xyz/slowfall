package xyz.soda.slowfall.airport.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.airport.api.CreateAirportRequest;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;

@Service
public class AirportService {
    private final AirportRepository repository;

    public AirportService(AirportRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Airport createAirport(CreateAirportRequest request) {
        Airport airport = new Airport(request.icaoCode(), request.name(), request.timezone());
        return repository.save(airport);
    }

    @Transactional(readOnly = true)
    public java.util.List<Airport> listAllAirports() {
        return repository.findAll();
    }
}
