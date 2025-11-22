package xyz.soda.slowfall.craft.infra;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.craft.domain.Craft;

import java.util.Optional;
import java.util.UUID;

public interface CraftRepository extends JpaRepository<Craft, UUID> {

    Optional<Craft> findByRegistrationNumber(String registrationNumber);

    Optional<Craft> findByName(String name);
}
