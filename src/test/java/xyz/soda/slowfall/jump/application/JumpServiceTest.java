package xyz.soda.slowfall.jump.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;
import xyz.soda.slowfall.jump.api.CreateJumpRequest;
import xyz.soda.slowfall.jump.domain.Jump;
import xyz.soda.slowfall.jump.infra.JumpRepository;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JumpServiceTest {

    @Mock
    JumpRepository jumpRepository;

    @Mock
    PersonRepository personRepository;

    @Mock
    AirportRepository airportRepository;

    @InjectMocks
    JumpService service;

    @Test
    void createJumpThrowsWhenAirportMissing() {
        CreateJumpRequest req = new CreateJumpRequest(LocalDateTime.now(), UUID.randomUUID(), "REG-1", 12000, null);
        when(airportRepository.findById(req.airportId())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.createJump(req));
    }

    @Test
    void createJumpThrowsWhenScheduledInPast() {
        UUID airportId = UUID.randomUUID();
        Airport airport = new Airport("EGLL", "Heathrow", "UTC");
        when(airportRepository.findById(airportId)).thenReturn(Optional.of(airport));

        // schedule jump 2 days in the past relative to UTC
        LocalDateTime past = LocalDateTime.now(ZoneId.of("UTC")).minusDays(2);
        CreateJumpRequest req = new CreateJumpRequest(past, airportId, "REG-1", 12000, null);

        assertThrows(IllegalArgumentException.class, () -> service.createJump(req));
    }

    @Test
    void createJumpAddsPilotIfProvided() {
        UUID airportId = UUID.randomUUID();
        Airport airport = new Airport("EGLL", "Heathrow", "UTC");
        when(airportRepository.findById(airportId)).thenReturn(Optional.of(airport));

        UUID pilotId = UUID.randomUUID();
        Person pilot = new Person("P", "I", true, false, 80, "p@i.com");
        when(personRepository.findById(pilotId)).thenReturn(Optional.of(pilot));

        CreateJumpRequest req = new CreateJumpRequest(
                LocalDateTime.now(ZoneId.of("UTC")).plusDays(1), airportId, "REG-1", 12000, pilotId);
        when(jumpRepository.save(any(Jump.class))).thenAnswer(i -> i.getArgument(0));

        Jump created = service.createJump(req);

        verify(jumpRepository).save(any(Jump.class));
        assertEquals(1, created.getPilots().size());
    }
}
