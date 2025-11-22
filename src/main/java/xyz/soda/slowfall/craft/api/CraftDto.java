package xyz.soda.slowfall.craft.api;

import xyz.soda.slowfall.craft.domain.Craft;

import java.util.UUID;

public record CraftDto(UUID id, String name, String registrationNumber, Integer capacityWeight,
                       Integer capacityPersons) {
    public static CraftDto from(Craft craft) {
        return new CraftDto(
                craft.getId(),
                craft.getName(),
                craft.getRegistrationNumber(),
                craft.getCapacityWeight(),
                craft.getCapacityPersons()
        );
    }
}
