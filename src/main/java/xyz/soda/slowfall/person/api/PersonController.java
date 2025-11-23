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

    /**
     * Create a new instance of {@code PersonController}.
     *
     * @param service the person service used for person operations
     */
    public PersonController(PersonService service) {
        this.service = service;
    }

    /**
     * Create a new person from the request.
     * @param request payload with person details
     * @return a ResponseEntity with created PersonDto and HTTP 201, or 400 on bad request
     */
    @PostMapping
    public ResponseEntity<PersonDto> createPerson(@RequestBody CreatePersonRequest request) {
        try {
            Person created = service.createPerson(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(PersonDto.from(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * List all people.
     * @return a list of PersonDto for all stored persons
     */
    @GetMapping
    public List<PersonDto> listPeople() {
        return service.listAllPeople().stream().map(PersonDto::from).toList();
    }

    /**
     * Search for persons with optional criteria and pagination.
     * @param firstName optional first name filter
     * @param lastName optional last name filter
     * @param pilot optional pilot flag filter
     * @param skyDiver optional sky diver flag filter
     * @param pageable pagination information
     * @return a paged ResponseEntity of PersonDto matching the criteria
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PersonDto>> searchPersons(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) Boolean pilot,
            @RequestParam(required = false) Boolean skyDiver,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Person> results = service.searchPersons(firstName, lastName, pilot, skyDiver, pageable);
        Page<PersonDto> dtoPage = results.map(PersonDto::from);
        return ResponseEntity.ok(dtoPage);
    }
}
