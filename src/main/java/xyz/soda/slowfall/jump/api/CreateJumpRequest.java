package xyz.soda.slowfall.jump.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateJumpRequest(
        @NotNull LocalDateTime jumpTime,
        @NotNull UUID airportId,
        @NotBlank String craftRegistrationNumber,
        @NotNull Integer altitudeFeet,
        UUID pilotId) {
}
