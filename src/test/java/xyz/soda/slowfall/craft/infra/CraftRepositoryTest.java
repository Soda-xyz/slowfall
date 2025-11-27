package xyz.soda.slowfall.craft.infra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import xyz.soda.slowfall.craft.domain.Craft;

@DataJpaTest
class CraftRepositoryTest {

    @Autowired
    CraftRepository repository;

    @Test
    void saveAndFindByRegistrationAndName() {
        Craft craft = new Craft("C1", "REG-1", 1000, 4);
        repository.save(craft);

        Optional<Craft> byReg = repository.findByRegistrationNumber("REG-1");
        assertTrue(byReg.isPresent());
        assertEquals("C1", byReg.get().getName());

        Optional<Craft> byName = repository.findByName("C1");
        assertTrue(byName.isPresent());
        assertEquals("REG-1", byName.get().getRegistrationNumber());
    }
}
