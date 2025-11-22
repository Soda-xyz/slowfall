package xyz.soda.slowfall.person.domain;

import jakarta.persistence.*;

import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "persons")
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private boolean Pilot;

    @Column(nullable = false)
    private boolean skyDiver;

    @Column(nullable = false)
    private Integer weight;

    @Column(nullable = false, unique = true)
    private String email;

    protected Person() {
    }

    public Person(String firstName, String lastName, boolean Pilot, boolean skyDiver, Integer weight, String email) {
        setFirstName(firstName);
        setLastName(lastName);
        setPilot(Pilot);
        setSkyDiver(skyDiver);
        setWeight(weight);
        setEmail(email);
    }

    public UUID getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("First name must not be blank");
        }
        this.firstName = firstName.trim();
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Last name must not be blank");
        }
        this.firstName = firstName.trim();
    }

    public boolean getPilot() {
        return Pilot;
    }

    public void setPilot(boolean Pilot) {
        this.Pilot = Pilot;
    }

    public boolean getSkyDiver() {
        return skyDiver;
    }

    public void setSkyDiver(boolean skyDiver) {
        this.skyDiver = skyDiver;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setWeight(Integer weight) {
        if (weight == null || weight <= 0) {
            throw new IllegalArgumentException("Weight must be positive");
        }
        this.weight = weight;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Email must be valid");
        }
        this.email = email.trim().toLowerCase();
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof Person person)) return false;
        return Objects.equals(id, person.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
