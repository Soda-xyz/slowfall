package xyz.soda.slowfall.jump.api;

import java.time.LocalDateTime;
import java.util.UUID;

public record JumpDto(UUID id, LocalDateTime jumpTime, UUID airportId, Integer altitudeFeet) {
}
