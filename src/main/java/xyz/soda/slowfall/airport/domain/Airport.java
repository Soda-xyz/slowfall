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

    protected Airport() {
    }

    public Airport(String ICAOCode, String name, String timezone) {
        this.icaoCode = ICAOCode;
        this.name = name;
        this.timezone = timezone;
    }

    public UUID getId() {
        return id;
    }

    public String getIcaoCode() {
        return icaoCode;
    }

    public void setIcaoCode(String icaoCode) {
        this.icaoCode = icaoCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Airport name must not be blank");
        }
        this.name = name.trim();
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            throw new IllegalArgumentException("Timezone must not be blank");
        }
        this.timezone = timezone.trim();
    }
}
