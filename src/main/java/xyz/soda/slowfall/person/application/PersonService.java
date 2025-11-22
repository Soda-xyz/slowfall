package xyz.soda.slowfall.person.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.person.api.CreatePersonRequest;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

import java.util.List;
import java.util.stream.Stream;

@Service
public class PersonService {

    private final PersonRepository repository;

    public PersonService(PersonRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Person createPerson(CreatePersonRequest request) {
        repository.findByEmail(request.email()).ifPresent(existing -> {
            throw new IllegalArgumentException("Person with email already exists: " + request.email());
        });

        Person person = new Person(request.firstName(), request.lastName(), request.pilot(), request.skyDiver(), request.weight(), request.email());
        return repository.save(person);
    }

    @Transactional(readOnly = true)
    public List<Person> listAllPeople() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Person> searchPersons(String firstName, String lastName, Boolean pilot, Boolean skyDiver, Pageable pageable) {
        Specification<Person> spec = Stream.of(
                        PersonSpecifications.firstNameContains(firstName),
                        PersonSpecifications.lastNameContains(lastName),
                        PersonSpecifications.isPilot(pilot),
                        PersonSpecifications.isSkyDiver(skyDiver)
                )
                .reduce(Specification::and)
                .orElse(null);

        return repository.findAll(spec, pageable);
    }
}
