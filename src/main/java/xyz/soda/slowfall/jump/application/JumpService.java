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
import java.util.List;
import java.util.UUID;

@Service
public class JumpService {

    private final JumpRepository jumpRepository;
    private final PersonRepository personRepository;
    private final AirportRepository airportRepository;

    /**
     * Create a new JumpService.
     *
     * @param jumpRepository    repository for persisting and retrieving jumps
     * @param personRepository  repository for retrieving persons
     * @param airportRepository repository for retrieving airports
     */
    public JumpService(
            JumpRepository jumpRepository, PersonRepository personRepository, AirportRepository airportRepository) {
        this.jumpRepository = jumpRepository;
        this.personRepository = personRepository;
        this.airportRepository = airportRepository;
    }

    /**
     * Create and persist a new jump from the given request.
     * Validates that the airport exists and that the scheduled time is not in the past
     * relative to the airport timezone.
     * @param request the request containing jump details (time, airport, altitude, optional pilot)
     * @return the persisted Jump entity
     * @throws IllegalArgumentException if the airport is not found, the time is in the past, or the pilot id is invalid
     */
    public Jump createJump(CreateJumpRequest request) {
        Airport airport = airportRepository
                .findById(request.airportId())
                .orElseThrow(() -> new IllegalArgumentException("Airport not found"));

        ZoneId airportZone = ZoneId.of(airport.getTimezone());
        LocalDateTime nowAtAirport = LocalDateTime.now(airportZone);

        if (request.jumpTime().isBefore(nowAtAirport)) {
            throw new IllegalArgumentException("Cannot schedule in the past");
        }

        Jump jump = new Jump(request.jumpTime(), request.airportId(), request.altitudeFeet());

        if (request.pilotId() != null) {
            Person pilot = personRepository
                    .findById(request.pilotId())
                    .orElseThrow(() -> new IllegalArgumentException("Pilot not found"));
            jump.addPilot(pilot);
        }

        return jumpRepository.save(jump);
    }

    /**
     * Add a passenger to an existing jump.
     * @param jumpId the id of the jump to modify
     * @param personId the id of the person to add as passenger
     * @throws IllegalArgumentException if the jump or person is not found
     */
    @Transactional
    public void addPassengerToJump(UUID jumpId, UUID personId) {
        Jump jump = jumpRepository.findById(jumpId).orElseThrow(() -> new IllegalArgumentException("Jump not found"));

        Person person =
                personRepository.findById(personId).orElseThrow(() -> new IllegalArgumentException("Person not found"));

        jump.addPassenger(person);
    }

    /**
     * Add a pilot to an existing jump.
     * @param jumpId the id of the jump to modify
     * @param personId the id of the person to add as pilot
     * @throws IllegalArgumentException if the jump or person is not found
     */
    @Transactional
    public void addPilotToJump(UUID jumpId, UUID personId) {
        Jump jump = jumpRepository.findById(jumpId).orElseThrow(() -> new IllegalArgumentException("Jump not found"));

        Person person =
                personRepository.findById(personId).orElseThrow(() -> new IllegalArgumentException("Person not found"));

        jump.addPilot(person);
    }

    /**
     * Retrieve all jumps.
     *
     * @return a list of all Jump entities
     */
    public List<Jump> listAllJumps() {
        return jumpRepository.findAll();
    }
}
