package xyz.soda.slowfall.craft.infra;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.craft.domain.Craft;

public interface CraftRepository extends JpaRepository<Craft, UUID> {

    /**
     * Find a craft by registration number.
     *
     * @param registrationNumber the registration number to search for
     * @return an Optional containing the Craft if found
     */
    Optional<Craft> findByRegistrationNumber(String registrationNumber);

    /**
     * Find a craft by name.
     * @param name the craft name to search for
     * @return an Optional containing the Craft if found
     */
    Optional<Craft> findByName(String name);
}
