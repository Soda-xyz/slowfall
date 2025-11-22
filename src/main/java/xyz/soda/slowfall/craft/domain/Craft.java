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

    protected Craft() {
    }

    public Craft(String name, String registrationNumber, Integer capacityWeight, Integer capacityPersons) {
        setName(name);
        setRegistrationNumber(registrationNumber);
        setCapacityWeight(capacityWeight);
        setCapacityPersons(capacityPersons);
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public Integer getCapacityWeight() {
        return capacityWeight;

    }

    public void setCapacityWeight(Integer capacityWeight) {
        this.capacityWeight = capacityWeight;
    }

    public Integer getCapacityPersons() {
        return capacityPersons;
    }

    public void setCapacityPersons(Integer capacityPersons) {
        this.capacityPersons = capacityPersons;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof Craft craft)) return false;
        return Objects.equals(id, craft.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}

