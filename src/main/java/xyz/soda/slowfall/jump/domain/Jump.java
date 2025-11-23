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

    /**
     * Protected no-args constructor for JPA.
     */
    protected Jump() {
    }

    /**
     * Create a new Jump with time, airport and altitude.
     *
     * @param jumpTime     the scheduled time of the jump
     * @param airportId    the airport id where the jump occurs
     * @param altitudeFeet altitude in feet for the jump
     */
    public Jump(LocalDateTime jumpTime, UUID airportId, Integer altitudeFeet) {
        this.jumpTime = jumpTime;
        this.airportId = airportId;
        this.altitudeFeet = altitudeFeet;
    }

    /**
     * Get the jump identifier.
     * @return the jump UUID
     */
    public UUID getId() {
        return id;
    }

    /**
     * Get the scheduled jump time.
     * @return the LocalDateTime of the jump
     */
    public LocalDateTime getJumpTime() {
        return jumpTime;
    }

    /**
     * Get the airport id associated with this jump.
     * @return airport UUID
     */
    public UUID getAirportId() {
        return airportId;
    }

    /**
     * Get the altitude for the jump in feet.
     * @return altitude in feet
     */
    public Integer getAltitudeFeet() {
        return altitudeFeet;
    }

    /**
     * Get the set of passengers for this jump.
     * @return an unmodifiable set of passengers (Person entities)
     */
    public Set<Person> getPassengers() {
        return passengers;
    }

    /**
     * Get the set of pilots for this jump.
     * @return an unmodifiable set of pilots (Person entities)
     */
    public Set<Person> getPilots() {
        return pilots;
    }

    /**
     * Get the creation timestamp.
     * @return the createdAt timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Add a passenger to this jump.
     * @param person the Person to add as passenger
     */
    public void addPassenger(Person person) {
        this.passengers.add(person);
    }

    /**
     * Add a pilot to this jump.
     * @param person the Person to add as pilot
     */
    public void addPilot(Person person) {
        this.pilots.add(person);
    }

    /**
     * Equality is based on the jump id.
     * @param object the object to compare
     * @return true if equal, false otherwise
     */
    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        Jump jump = (Jump) object;
        return Objects.equals(id, jump.id);
    }

    /**
     * Compute hash code using jump id.
     * @return the hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
