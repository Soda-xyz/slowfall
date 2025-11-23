package xyz.soda.slowfall.airport.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AirportTest {

    @Test
    void setNameRejectsBlank() {
        Airport a = new Airport("ABCD", "Heathrow", "Europe/London");
        assertThrows(IllegalArgumentException.class, () -> a.setName("   "));
    }

    @Test
    void setTimezoneRejectsBlank() {
        Airport a = new Airport("ABCD", "Heathrow", "Europe/London");
        assertThrows(IllegalArgumentException.class, () -> a.setTimezone(null));
    }

    @Test
    void icaoCodeSetterAndGetter() {
        Airport a = new Airport(null, "Name", "UTC");
        a.setIcaoCode("EGLL");
        assertEquals("EGLL", a.getIcaoCode());
    }
}
