package xyz.soda.slowfall.craft.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.soda.slowfall.craft.api.CreateCraftRequest;
import xyz.soda.slowfall.craft.domain.Craft;
import xyz.soda.slowfall.craft.infra.CraftRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CraftServiceTest {

    @Mock
    CraftRepository repository;

    @InjectMocks
    CraftService service;

    @Test
    void createCraftSucceedsWhenUnique() {
        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        when(repository.findByName("C1")).thenReturn(Optional.empty());
        when(repository.findByRegistrationNumber("REG-1")).thenReturn(Optional.empty());
        when(repository.save(any(Craft.class))).thenAnswer(i -> i.getArgument(0));

        Craft created = service.createCraft(req);

        assertEquals("C1", created.getName());
    }

    @Test
    void createCraftFailsWhenNameExists() {
        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        Craft existing = new Craft("C1", "REG-1", 1000, 4);
        when(repository.findByName("C1")).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> service.createCraft(req));
    }
}

