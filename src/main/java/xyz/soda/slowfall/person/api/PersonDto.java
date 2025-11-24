package xyz.soda.slowfall.person.api;

import xyz.soda.slowfall.person.domain.Person;

import java.util.UUID;

/**
 * Data transfer object for Person API responses.
 *
 * @param id       the person unique identifier
 * @param name     the person's full name (first + last)
 * @param pilot    whether the person is a pilot
 * @param skydiver whether the person is a sky diver
 * @param weight   the person's weight in kilograms (nullable)
 * @param email    the person's email address
 */
public record PersonDto(UUID id, String name, boolean pilot, boolean skydiver, Integer weight, String email) {
    /**
     * Convert Person domain object to PersonDto.
     * @param person the Person entity
     * @return a new PersonDto with aggregated fields (name, roles, etc.)
     */
    public static PersonDto from(Person person) {
        String fullName = person.getFirstName() + " " + person.getLastName();
        return new PersonDto(
                person.getId(),
                fullName,
                person.getPilot(),
                person.getSkydiver(),
                person.getWeight(),
                person.getEmail());
    }
}
