package xyz.soda.slowfall.airport.api;

import xyz.soda.slowfall.airport.domain.Airport;

import java.util.UUID;

public record AirportDto(UUID id, String name, String icaoCode, String timezone) {
    public static AirportDto from(Airport airport) {
        return new AirportDto(airport.getId(), airport.getName(), airport.getIcaoCode(), airport.getTimezone());
    }
}
