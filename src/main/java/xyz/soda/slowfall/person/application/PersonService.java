package xyz.soda.slowfall.person.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.person.api.CreatePersonRequest;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

import java.util.List;

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
}
