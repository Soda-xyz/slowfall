package xyz.soda.slowfall.repository;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.jpa.repository.JpaRepository;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ExampleRepositoryTest {

    @Autowired
    TestEntityManager entityManager;
    @Autowired
    PersonRepository repository;

    @Test
    void jpaRepositoryPersistsEntity() {
        PersonEntity p = new PersonEntity("Bob");
        PersonEntity saved = entityManager.persistFlushFind(p);

        assertThat(repository.findById(saved.id)).isPresent().get().extracting("name").isEqualTo("Bob");
    }

    interface PersonRepository extends JpaRepository<PersonEntity, Long> {
    }

    @Entity
    static class PersonEntity {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        Long id;
        String name;

        @SuppressWarnings("unused")
        protected PersonEntity() {
        }

        PersonEntity(String name) {
            this.name = name;
        }
    }
}
