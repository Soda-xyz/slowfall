package xyz.soda.slowfall.craft.api;

import java.util.UUID;
import xyz.soda.slowfall.craft.domain.Craft;

/**
 * Data transfer object for Craft API responses.
 *
 * @param id                 the craft unique identifier
 * @param name               the craft name
 * @param registrationNumber the craft registration number
 * @param capacityWeight     weight capacity for the craft
 * @param capacityPersons    person capacity for the craft
 */
public record CraftDto(
        UUID id, String name, String registrationNumber, Integer capacityWeight, Integer capacityPersons) {
    /**
     * Convert Craft domain object to CraftDto.
     * @param craft the Craft entity
     * @return a populated CraftDto
     */
    public static CraftDto from(Craft craft) {
        return new CraftDto(
                craft.getId(),
                craft.getName(),
                craft.getRegistrationNumber(),
                craft.getCapacityWeight(),
                craft.getCapacityPersons());
    }
}
