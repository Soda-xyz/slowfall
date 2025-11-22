package xyz.soda.slowfall.jump.domain;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import xyz.soda.slowfall.person.domain.Person;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "jumps")
public class Jump {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDateTime jumpTime;

    @Column(nullable = false)
    private UUID airportId;

    @Column(nullable = false)
    private Integer altitudeFeet;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @ManyToMany
    @JoinTable(
            name = "jump_passengers",
            joinColumns = @JoinColumn(name = "jump_id"),
            inverseJoinColumns = @JoinColumn(name = "person_id"))

    private final Set<Person> passengers = new HashSet<>();
    @ManyToMany
    @JoinTable(
            name = "jump_pilots",
            joinColumns = @JoinColumn(name = "jump_id"),
            inverseJoinColumns = @JoinColumn(name = "person_id"))

    private final Set<Person> pilots = new HashSet<>();

    protected Jump() {
    }

    public Jump(LocalDateTime jumpTime, UUID airportId, Integer altitudeFeet) {
        this.jumpTime = jumpTime;
        this.airportId = airportId;
        this.altitudeFeet = altitudeFeet;
    }

    public UUID getId() {
        return id;
    }

    public LocalDateTime getJumpTime() {
        return jumpTime;
    }

    public UUID getAirportId() {
        return airportId;
    }

    public Integer getAltitudeFeet() {
        return altitudeFeet;
    }

    public Set<Person> getPassengers() {
        return passengers;
    }

    public Set<Person> getPilots() {
        return pilots;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void addPassenger(Person person) {
        this.passengers.add(person);
    }

    public void addPilot(Person person) {
        this.pilots.add(person);
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        Jump jump = (Jump) object;
        return Objects.equals(id, jump.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}