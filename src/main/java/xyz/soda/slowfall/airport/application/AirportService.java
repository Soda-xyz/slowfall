package xyz.soda.slowfall.airport.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;

@Service
public class AirportService {
    private final AirportRepository repository;

    public AirportService(AirportRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Airport createAirport(String name, String icaoCode, String timezone) {

        Airport airport = new Airport(name, icaoCode, timezone);
        return repository.save(airport);
    }
}
