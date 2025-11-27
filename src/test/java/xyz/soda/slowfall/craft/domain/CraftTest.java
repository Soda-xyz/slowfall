package xyz.soda.slowfall.craft.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class CraftTest {

    @Test
    void capacitySettersAndGetters() {
        Craft c = new Craft("C1", "REG-1", 1000, 4);
        c.setCapacityWeight(1200);
        c.setCapacityPersons(6);
        assertEquals(1200, c.getCapacityWeight());
        assertEquals(6, c.getCapacityPersons());
    }

    @Test
    void registrationSetterGetter() {
        Craft c = new Craft("C1", "REG-1", 1000, 4);
        c.setRegistrationNumber("NEW-REG");
        assertEquals("NEW-REG", c.getRegistrationNumber());
    }
}
