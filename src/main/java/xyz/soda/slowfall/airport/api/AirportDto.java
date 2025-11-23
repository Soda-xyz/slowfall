package xyz.soda.slowfall.airport.api;

import xyz.soda.slowfall.airport.domain.Airport;

import java.util.UUID;

/**
 * Data transfer object for Airport API responses.
 *
 * @param id       the airport unique identifier
 * @param name     the airport display name
 * @param icaoCode the ICAO code for the airport
 * @param timezone the timezone id for the airport
 */
public record AirportDto(UUID id, String name, String icaoCode, String timezone) {
    /**
     * Convert Airport domain object to AirportDto.
     * @param airport the airport domain object
     * @return a populated AirportDto
     */
    public static AirportDto from(Airport airport) {
        return new AirportDto(airport.getId(), airport.getName(), airport.getIcaoCode(), airport.getTimezone());
    }
}
