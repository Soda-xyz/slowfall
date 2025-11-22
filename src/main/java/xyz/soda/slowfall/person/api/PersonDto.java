package xyz.soda.slowfall.person.api;

import xyz.soda.slowfall.person.domain.Person;

import java.util.UUID;

public record PersonDto(UUID id, String name, boolean pilot, boolean skyDiver, Integer weight, String email) {
    public static PersonDto from(Person person) {
        return new PersonDto(person.getId(), person.getFirstName(), person.getPilot(), person.getSkyDiver(), person.getWeight(),
                person.getEmail());
    }
}
