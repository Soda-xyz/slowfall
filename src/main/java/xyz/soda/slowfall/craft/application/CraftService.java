package xyz.soda.slowfall.craft.application;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.craft.api.CreateCraftRequest;
import xyz.soda.slowfall.craft.domain.Craft;
import xyz.soda.slowfall.craft.infra.CraftRepository;

@Service
public class CraftService {
    private final CraftRepository repository;

    /**
     * Create a new instance of {@code CraftService}.
     *
     * @param repository the repository used to persist crafts
     */
    public CraftService(CraftRepository repository) {
        this.repository = repository;
    }

    /**
     * Create and persist a new craft from the request. Validates uniqueness by name and registration number.
     * @param request the request payload containing craft details
     * @return the saved Craft entity
     * @throws IllegalArgumentException if a craft with the same name or registration number exists
     */
    @Transactional
    public Craft createCraft(CreateCraftRequest request) {
        repository.findByName(request.name()).ifPresent(existing -> {
            throw new IllegalArgumentException("Craft named %s already exists.".formatted(request.name()));
        });
        repository.findByRegistrationNumber(request.registrationNumber()).ifPresent(existing -> {
            throw new IllegalArgumentException("Craft %s already exists".formatted(request.registrationNumber()));
        });

        Craft craft = new Craft(
                request.name(), request.registrationNumber(), request.capacityWeight(), request.capacityPersons());
        return repository.save(craft);
    }

    /**
     * List all crafts.
     * @return a list of all Craft entities
     */
    @Transactional(readOnly = true)
    public List<Craft> listAllCrafts() {
        return repository.findAll();
    }
}
