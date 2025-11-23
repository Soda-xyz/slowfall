package xyz.soda.slowfall.person.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class PersonTest {

    @Test
    void setFirstNameRejectsBlank() {
        Person p = new Person("A", "B", false, false, 70, "a@b.com");
        assertThrows(IllegalArgumentException.class, () -> p.setFirstName("  "));
    }

    @Test
    void setWeightRejectsNonPositive() {
        Person p = new Person("A", "B", false, false, 70, "a@b.com");
        assertThrows(IllegalArgumentException.class, () -> p.setWeight(0));
    }

    @Test
    void setEmailRejectsInvalid() {
        Person p = new Person("A", "B", false, false, 70, "a@b.com");
        assertThrows(IllegalArgumentException.class, () -> p.setEmail("not-an-email"));
    }
}
