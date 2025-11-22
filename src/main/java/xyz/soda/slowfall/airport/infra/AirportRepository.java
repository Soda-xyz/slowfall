package xyz.soda.slowfall.airport.infra;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.airport.domain.Airport;

import java.util.Optional;
import java.util.UUID;

public interface AirportRepository extends JpaRepository<Airport, UUID> {

    Optional<Airport> findByIcaoCode(String icaoCode);

    Optional<Airport> findByName(String name);
}
