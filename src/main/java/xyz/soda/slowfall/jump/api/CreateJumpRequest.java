package xyz.soda.slowfall.jump.api;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateJumpRequest(
        @NotBlank LocalDateTime jumpTime,
        @NotBlank UUID airportId,
        @NotBlank String craftRegistrationNumber,
        @NotBlank Integer altitudeFeet,
        UUID pilotId) {
}
