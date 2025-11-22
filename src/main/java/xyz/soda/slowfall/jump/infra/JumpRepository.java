package xyz.soda.slowfall.jump.infra;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.soda.slowfall.jump.domain.Jump;

import java.util.UUID;

public interface JumpRepository extends JpaRepository<Jump, UUID> {
}
