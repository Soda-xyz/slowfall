package xyz.soda.slowfall.airport.infra;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.airport.domain.Airport;

import java.util.Optional;
import java.util.UUID;

public interface AirportRepository extends JpaRepository<Airport, UUID> {

    /**
     * Find an airport by its ICAO code.
     *
     * @param icaoCode the ICAO code to search for
     * @return an Optional containing the Airport if found
     */
    Optional<Airport> findByIcaoCode(String icaoCode);

    /**
     * Find an airport by its name.
     * @param name the airport name to search for
     * @return an Optional containing the Airport if found
     */
    Optional<Airport> findByName(String name);
}
