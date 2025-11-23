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
    private boolean pilot;

    @Column(nullable = false)
    private boolean skyDiver;

    @Column(nullable = false)
    private Integer weight;

    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Protected no-args constructor for JPA.
     */
    protected Person() {
    }

    /**
     * Create a new Person with provided attributes.
     *
     * @param firstName the person's first name
     * @param lastName  the person's last name
     * @param pilot     whether the person is a pilot
     * @param skyDiver  whether the person is a sky diver
     * @param weight    the person's weight in kilograms
     * @param email     the person's email address
     */
    public Person(String firstName, String lastName, boolean pilot, boolean skyDiver, Integer weight, String email) {
        setFirstName(firstName);
        setLastName(lastName);
        setPilot(pilot);
        setSkyDiver(skyDiver);
        setWeight(weight);
        setEmail(email);
    }

    /**
     * Get the person identifier.
     * @return the person UUID
     */
    public UUID getId() {
        return id;
    }

    /**
     * Get the first name.
     * @return the first name
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Set the first name. First name must not be blank.
     * @param firstName the first name to set
     * @throws IllegalArgumentException if {@code firstName} is null or blank
     */
    public void setFirstName(String firstName) {
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("First name must not be blank");
        }
        this.firstName = firstName.trim();
    }

    /**
     * Get the last name.
     * @return the last name
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Set the last name. Last name must not be blank.
     * @param lastName the last name to set
     * @throws IllegalArgumentException if {@code lastName} is null or blank
     */
    public void setLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Last name must not be blank");
        }
        this.lastName = lastName.trim();
    }

    /**
     * Get whether the person is a pilot.
     * @return {@code true} if person is a pilot, otherwise {@code false}
     */
    public boolean getPilot() {
        return pilot;
    }

    /**
     * Set pilot flag for the person.
     * @param pilot true if the person is a pilot
     */
    public void setPilot(boolean pilot) {
        this.pilot = pilot;
    }

    /**
     * Get whether the person is a sky diver.
     * @return {@code true} if person is a sky diver, otherwise {@code false}
     */
    public boolean getSkyDiver() {
        return skyDiver;
    }

    /**
     * Set sky diver flag for the person.
     * @param skyDiver true if the person is a sky diver
     */
    public void setSkyDiver(boolean skyDiver) {
        this.skyDiver = skyDiver;
    }

    /**
     * Get the person's weight.
     * @return the weight as Integer
     */
    public Integer getWeight() {
        return weight;
    }

    /**
     * Set the person's weight. Weight must be positive.
     * @param weight the weight to set
     * @throws IllegalArgumentException if {@code weight} is null or non-positive
     */
    public void setWeight(Integer weight) {
        if (weight == null || weight <= 0) {
            throw new IllegalArgumentException("Weight must be positive");
        }
        this.weight = weight;
    }

    /**
     * Get the person's email.
     * @return the email address
     */
    public String getEmail() {
        return email;
    }

    /**
     * Set the person's email. Email must contain an '@'.
     * @param email the email to set
     * @throws IllegalArgumentException if {@code email} is null or invalid
     */
    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Email must be valid");
        }
        this.email = email.trim().toLowerCase();
    }

    /**
     * Equality is based on the person id.
     * @param object the object to compare
     * @return true if equal, false otherwise
     */
    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof Person person)) return false;
        return Objects.equals(id, person.id);
    }

    /**
     * Compute hash code using person id.
     * @return the hash code
     */
    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
