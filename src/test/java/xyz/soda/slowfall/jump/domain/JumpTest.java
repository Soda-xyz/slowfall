package xyz.soda.slowfall.jump.domain;

import org.junit.jupiter.api.Test;
import xyz.soda.slowfall.person.domain.Person;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JumpTest {

    @Test
    void addPassengersAndPilots() {
        Jump j = new Jump(LocalDateTime.now(), UUID.randomUUID(), 13000);
        Person p1 = new Person("A", "B", false, false, 70, "a@b.com");
        Person p2 = new Person("C", "D", false, false, 75, "c@d.com");

        j.addPassenger(p1);
        j.addPilot(p2);

        assertEquals(1, j.getPassengers().size());
        assertEquals(1, j.getPilots().size());
    }
}
