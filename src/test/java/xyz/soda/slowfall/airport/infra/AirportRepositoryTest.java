package xyz.soda.slowfall.airport.infra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import xyz.soda.slowfall.airport.domain.Airport;

@DataJpaTest
class AirportRepositoryTest {

    @Autowired
    AirportRepository repository;

    @Test
    void saveAndFindByIcaoAndName() {
        Airport airport = new Airport("EGLL", "Heathrow", "Europe/London");
        repository.save(airport);

        Optional<Airport> byIcao = repository.findByIcaoCode("EGLL");
        assertTrue(byIcao.isPresent());
        assertEquals("Heathrow", byIcao.get().getName());

        Optional<Airport> byName = repository.findByName("Heathrow");
        assertTrue(byName.isPresent());
        assertEquals("EGLL", byName.get().getIcaoCode());
    }
}
