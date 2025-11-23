package xyz.soda.slowfall.person.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.soda.slowfall.person.api.CreatePersonRequest;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonServiceTest {

    @Mock
    PersonRepository repository;

    @InjectMocks
    PersonService service;

    @Test
    void createPersonSucceedsWhenEmailNotPresent() {
        CreatePersonRequest req = new CreatePersonRequest("John", "Doe", false, true, 75, "john@example.com");

        when(repository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(repository.save(any(Person.class))).thenAnswer(i -> i.getArgument(0));

        Person created = service.createPerson(req);

        assertEquals("john@example.com", created.getEmail());
        verify(repository).save(any(Person.class));
    }

    @Test
    void createPersonThrowsWhenEmailExists() {
        CreatePersonRequest req = new CreatePersonRequest("John", "Doe", false, true, 75, "john@example.com");
        Person existing = new Person("Existing", "User", false, false, 80, "john@example.com");

        when(repository.findByEmail("john@example.com")).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> service.createPerson(req));
    }
}
