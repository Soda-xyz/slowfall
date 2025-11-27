package xyz.soda.slowfall.jump.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import xyz.soda.slowfall.jump.domain.Jump;
import xyz.soda.slowfall.person.api.PersonDto;

/**
 * Data transfer object for Jump API responses.
 *
 * @param id           the jump unique identifier
 * @param jumpTime     the scheduled date/time of the jump
 * @param airportId    the airport id where the jump occurs
 * @param altitudeFeet altitude in feet for the jump
 * @param skydivers   list of skydiver PersonDto
 * @param pilots       list of pilot PersonDto
 */
public record JumpDto(
        UUID id,
        Instant jumpTime,
        UUID airportId,
        Integer altitudeFeet,
        List<PersonDto> skydivers,
        List<PersonDto> pilots) {
    /**
     * Convert a Jump domain object to a JumpDto.
     * @param jump the Jump entity
     * @return a populated JumpDto
     */
    public static JumpDto from(Jump jump) {
        List<PersonDto> skydivers =
                jump.getSkydivers().stream().map(PersonDto::from).collect(Collectors.toList());
        List<PersonDto> pilots = jump.getPilots().stream().map(PersonDto::from).collect(Collectors.toList());
        return new JumpDto(
                jump.getId(), jump.getJumpTime(), jump.getAirportId(), jump.getAltitudeFeet(), skydivers, pilots);
    }
}
