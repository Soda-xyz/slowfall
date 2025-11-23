package xyz.soda.slowfall.airport.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.soda.slowfall.airport.api.CreateAirportRequest;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AirportServiceTest {

    @Mock
    AirportRepository repository;

    @InjectMocks
    AirportService service;

    @Test
    void createAirportSavesEntity() {
        CreateAirportRequest req = new CreateAirportRequest("EGLL", "Heathrow", "Europe/London");
        when(repository.save(any(Airport.class))).thenAnswer(i -> i.getArgument(0));

        Airport created = service.createAirport(req);

        assertEquals("Heathrow", created.getName());
        verify(repository).save(any(Airport.class));
    }

    @Test
    void listAllAirportsReturnsRepositoryList() {
        Airport a = new Airport("EGLL", "Heathrow", "Europe/London");
        when(repository.findAll()).thenReturn(List.of(a));

        java.util.List<Airport> results = service.listAllAirports();

        assertEquals(1, results.size());
        assertEquals("Heathrow", results.iterator().next().getName());
    }
}
