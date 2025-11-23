package xyz.soda.slowfall.airport.domain;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "airports")
public class Airport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column()
    private String icaoCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String timezone;

    /**
     * Protected no-args constructor for JPA.
     */
    protected Airport() {
    }

    /**
     * Create a new Airport with the given properties.
     *
     * @param ICAOCode the ICAO code for the airport
     * @param name     the visible name of the airport
     * @param timezone the timezone id for the airport (e.g. "Europe/London")
     */
    public Airport(String ICAOCode, String name, String timezone) {
        this.icaoCode = ICAOCode;
        this.name = name;
        this.timezone = timezone;
    }

    /**
     * Get the airport identifier.
     * @return the airport UUID
     */
    public UUID getId() {
        return id;
    }

    /**
     * Get the ICAO code for this airport.
     * @return the ICAO code string
     */
    public String getIcaoCode() {
        return icaoCode;
    }

    /**
     * Set the ICAO code for this airport.
     * @param icaoCode the ICAO code to set
     */
    public void setIcaoCode(String icaoCode) {
        this.icaoCode = icaoCode;
    }

    /**
     * Get the airport name.
     * @return the airport name
     */
    public String getName() {
        return name;
    }

    /**
     * Set the airport name. Name must not be blank.
     * @param name the name to set
     * @throws IllegalArgumentException if {@code name} is null or blank
     */
    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Airport name must not be blank");
        }
        this.name = name.trim();
    }

    /**
     * Get the airport timezone id.
     * @return the timezone id string
     */
    public String getTimezone() {
        return timezone;
    }

    /**
     * Set the airport timezone. Timezone must not be blank.
     * @param timezone the timezone id to set
     * @throws IllegalArgumentException if {@code timezone} is null or blank
     */
    public void setTimezone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            throw new IllegalArgumentException("Timezone must not be blank");
        }
        this.timezone = timezone.trim();
    }
}
