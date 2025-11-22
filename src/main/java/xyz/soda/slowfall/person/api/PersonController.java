package xyz.soda.slowfall.person.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.soda.slowfall.person.application.PersonService;
import xyz.soda.slowfall.person.domain.Person;

import java.util.List;

@RestController
@RequestMapping("/api/people")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class PersonController {

    private final PersonService service;

    public PersonController(PersonService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PersonDto> createPerson(@RequestBody CreatePersonRequest request) {
        try {
            Person created = service.createPerson(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(PersonDto.from(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public List<PersonDto> listPeople() {
        return service.listAllPeople().stream().map(PersonDto::from).toList();
    }

    @GetMapping
    public ResponseEntity<Page<PersonDto>> searchPersons(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) Boolean pilot,
            @RequestParam(required = false) Boolean skyDiver,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<Person> results = service.searchPersons(firstName, lastName, pilot, skyDiver, pageable);
        Page<PersonDto> dtoPage = results.map(PersonDto::from);
        return ResponseEntity.ok(dtoPage);
    }
}