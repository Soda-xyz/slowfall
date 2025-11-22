package xyz.soda.slowfall.jump.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;
import xyz.soda.slowfall.jump.api.CreateJumpRequest;
import xyz.soda.slowfall.jump.domain.Jump;
import xyz.soda.slowfall.jump.infra.JumpRepository;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
public class JumpService {

    private final JumpRepository jumpRepository;
    private final PersonRepository personRepository;
    private final AirportRepository airportRepository;

    public JumpService(JumpRepository jumpRepository,
                       PersonRepository personRepository,
                       AirportRepository airportRepository) {
        this.jumpRepository = jumpRepository;
        this.personRepository = personRepository;
        this.airportRepository = airportRepository;
    }

    public Jump createJump(CreateJumpRequest request) {
        Airport airport = airportRepository.findById(request.airportId())
                .orElseThrow(() -> new IllegalArgumentException("Airport not found"));

        ZoneId airportZone = ZoneId.of(airport.getTimezone());
        LocalDateTime nowAtAirport = LocalDateTime.now(airportZone);

        if (request.jumpTime().isBefore(nowAtAirport)) {
            throw new IllegalArgumentException("Cannot schedule in the past");
        }

        Jump jump = new Jump(request.jumpTime(), request.airportId(), request.altitudeFeet());

        return jumpRepository.save(jump);
    }

    @Transactional
    public void addPassengerToJump(UUID jumpId, UUID personId) {
        Jump jump = jumpRepository.findById(jumpId)
                .orElseThrow(() -> new IllegalArgumentException("Jump not found"));

        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person not found"));

        jump.addPassenger(person);
    }

    @Transactional
    public void addPilotToJump(UUID jumpId, UUID personId) {
        Jump jump = jumpRepository.findById(jumpId)
                .orElseThrow(() -> new IllegalArgumentException("Jump not found"));

        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person not found"));

        jump.addPilot(person);
    }
}
