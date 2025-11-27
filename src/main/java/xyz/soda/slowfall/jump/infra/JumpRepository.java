package xyz.soda.slowfall.jump.infra;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.jump.domain.Jump;

public interface JumpRepository extends JpaRepository<Jump, UUID> {}
