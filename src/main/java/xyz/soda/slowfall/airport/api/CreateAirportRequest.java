package xyz.soda.slowfall.airport.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAirportRequest(
        @NotBlank
        @Size(max = 30)
        String name,
        @Size(max = 4)
        String icaoCode,
        String timezone) {
}
