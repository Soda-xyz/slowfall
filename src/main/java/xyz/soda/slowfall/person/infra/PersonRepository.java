package xyz.soda.slowfall.person.infra;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import xyz.soda.slowfall.person.domain.Person;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID>, JpaSpecificationExecutor<Person> {

    Optional<Person> findByEmail(String email);

    List<Person> findByFirstNameContaining(String firstName);

    List<Person> findByLastNameContaining(String lastName);

    List<Person> findByPilot(boolean pilot);

    List<Person> findBySkyDiver(boolean skyDiver);
}
