package xyz.soda.slowfall.person.infra;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import xyz.soda.slowfall.person.domain.Person;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class PersonRepositoryTest {

    @Autowired
    PersonRepository repository;

    @Test
    void saveAndFindByEmail() {
        Person p = new Person("First", "Last", false, false, 60, "f@l.com");
        repository.save(p);

        assertThat(repository.findByEmail("f@l.com"))
                .isPresent()
                .get()
                .extracting(Person::getEmail)
                .isEqualTo("f@l.com");
    }

    @Test
    void findByFirstNameContaining() {
        Person p = new Person("Alice", "Z", false, false, 60, "a@z.com");
        repository.save(p);

        List<Person> matches = repository.findByFirstNameContaining("Ali");
        assertThat(matches).extracting(Person::getFirstName).contains("Alice");
    }
}
