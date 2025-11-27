package xyz.soda.slowfall.craft.domain;

import jakarta.persistence.*;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "crafts")
public class Craft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String registrationNumber;

    @Column(nullable = false)
    private Integer capacityWeight;

    @Column(nullable = false)
    private Integer capacityPersons;

    /**
     * Protected no-args constructor required by JPA.
     */
    protected Craft() {}

    /**
     * Create a Craft with the specified attributes.
     *
     * @param name               the craft name
     * @param registrationNumber the unique registration identifier
     * @param capacityWeight     weight capacity in appropriate units
     * @param capacityPersons    person capacity
     */
    public Craft(String name, String registrationNumber, Integer capacityWeight, Integer capacityPersons) {
        setName(name);
        setRegistrationNumber(registrationNumber);
        setCapacityWeight(capacityWeight);
        setCapacityPersons(capacityPersons);
    }

    /**
     * Get the craft identifier.
     * @return the craft UUID
     */
    public UUID getId() {
        return id;
    }

    /**
     * Get the craft name.
     * @return the craft name
     */
    public String getName() {
        return name;
    }

    /**
     * Set the craft name.
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Get the registration number.
     * @return the registration number
     */
    public String getRegistrationNumber() {
        return registrationNumber;
    }

    /**
     * Set the registration number.
     * @param registrationNumber the registration number to set
     */
    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    /**
     * Get the weight capacity.
     * @return capacity weight as Integer
     */
    public Integer getCapacityWeight() {
        return capacityWeight;
    }

    /**
     * Set the weight capacity.
     * @param capacityWeight the weight capacity to set
     */
    public void setCapacityWeight(Integer capacityWeight) {
        this.capacityWeight = capacityWeight;
    }

    /**
     * Get the person capacity.
     * @return capacity in persons as Integer
     */
    public Integer getCapacityPersons() {
        return capacityPersons;
    }

    /**
     * Set the person capacity.
     * @param capacityPersons the number of persons capacity to set
     */
    public void setCapacityPersons(Integer capacityPersons) {
        this.capacityPersons = capacityPersons;
    }

    /**
     * Equality is based on the craft id.
     * @param object the object to compare
     * @return true if equal, false otherwise
     */
    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof Craft craft)) return false;
        return Objects.equals(id, craft.id);
    }

    /**
     * Compute hash code using craft id.
     * @return the hash code
     */
    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
