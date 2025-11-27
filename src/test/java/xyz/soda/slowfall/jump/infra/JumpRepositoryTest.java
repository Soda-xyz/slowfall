package xyz.soda.slowfall.jump.infra;

import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import xyz.soda.slowfall.jump.domain.Jump;

@DataJpaTest
class JumpRepositoryTest {

    @Autowired
    JumpRepository repository;

    @Test
    void saveAndFind() {
        Jump j = new Jump(Instant.now(), UUID.randomUUID(), 12000);

        repository.save(j);

        var all = repository.findAll();
        assertFalse(all.isEmpty());
    }
}
