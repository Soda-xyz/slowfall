package xyz.soda.slowfall.craft.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateCraftRequest(
        @NotBlank @Size(max = 20) String name,
        @NotBlank @Size(max = 7) String registrationNumber,
        @NotBlank @Positive Integer capacityWeight,
        @NotBlank @Positive Integer capacityPersons) {
}
