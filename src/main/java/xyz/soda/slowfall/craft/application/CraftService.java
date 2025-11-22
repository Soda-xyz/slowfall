package xyz.soda.slowfall.craft.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.soda.slowfall.craft.api.CreateCraftRequest;
import xyz.soda.slowfall.craft.domain.Craft;
import xyz.soda.slowfall.craft.infra.CraftRepository;

import java.util.List;

@Service
public class CraftService {
    private final CraftRepository repository;

    public CraftService(CraftRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Craft createCraft(CreateCraftRequest request) {
        repository.findByName(request.name()).ifPresent(existing -> {
            throw new IllegalArgumentException("Craft named %s already exists.".formatted(request.name()));
        });
        repository.findByRegistrationNumber(request.registrationNumber()).ifPresent(existing -> {
            throw new IllegalArgumentException("Craft %s already exists".formatted(request.registrationNumber()));
        });

        Craft craft = new Craft(
                request.name(),
                request.registrationNumber(),
                request.capacityWeight(),
                request.capacityPersons()
        );
        return repository.save(craft);
    }

    @Transactional(readOnly = true)
    public List<Craft> listAllCrafts() {
        return repository.findAll();
    }
}
