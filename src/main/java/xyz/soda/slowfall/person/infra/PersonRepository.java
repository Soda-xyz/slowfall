package xyz.soda.slowfall.person.infra;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import xyz.soda.slowfall.person.domain.Person;

public interface PersonRepository extends JpaRepository<Person, UUID>, JpaSpecificationExecutor<Person> {

    /**
     * Find a person by email.
     *
     * @param email email to search for
     * @return Optional containing Person if found
     */
    Optional<Person> findByEmail(String email);

    /**
     * Find persons whose first name contains the provided text.
     * @param firstName substring to match in first name
     * @return list of matching Person entities
     */
    List<Person> findByFirstNameContaining(String firstName);

    /**
     * Find persons whose last name contains the provided text.
     * @param lastName substring to match in last name
     * @return list of matching Person entities
     */
    List<Person> findByLastNameContaining(String lastName);

    /**
     * Find persons by pilot flag.
     * @param pilot pilot status to match
     * @return list of matching Person entities
     */
    List<Person> findByPilot(boolean pilot);

    /**
     * Find persons by sky diver flag.
     * @param skydiver sky diver status to match
     * @return list of matching Person entities
     */
    List<Person> findBySkydiver(boolean skydiver);
}
