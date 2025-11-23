package xyz.soda.slowfall.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExampleServiceTest {

    @Mock
    ExampleRepository repository;
    @InjectMocks
    ExampleService service;

    @Test
    void shouldReturnNameFromRepository() {
        long id = 1L;
        when(repository.findNameById(id)).thenReturn("Alice");

        String name = service.getName(id);

        assertEquals("Alice", name);
    }

    // Local, test-scoped repository interface to keep this test self-contained
    interface ExampleRepository {
        String findNameById(long id);
    }

    // Minimal service implementation placed in the test so this compiles without touching production code
    static class ExampleService {
        private final ExampleRepository repository;

        ExampleService(ExampleRepository repository) {
            this.repository = repository;
        }

        String getName(long id) {
            return repository.findNameById(id);
        }
    }
}
