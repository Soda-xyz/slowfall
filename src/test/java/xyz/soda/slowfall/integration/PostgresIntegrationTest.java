package xyz.soda.slowfall.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Skeleton for an integration test that can be enabled to use Testcontainers.
 * <p>
 * Notes:
 * - To run a Testcontainers-backed test, set the environment variable TESTCONTAINERS=true
 * and ensure Docker is available on the runner.
 * - The example Testcontainers usage is included below as commented code. If you add the
 * Testcontainers dependency to Gradle (already suggested in build.gradle), you may
 * uncomment and use it.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "TESTCONTAINERS", matches = "true")
public class PostgresIntegrationTest {

    @Test
    void contextLoadsWhenTestcontainersEnabled() {
        // This test is intentionally empty when TESTCONTAINERS is not enabled. If you
        // want a real Postgres container-based test, uncomment and adapt the example
        // below and ensure the Testcontainers dependencies are available in Gradle.

        /*
        // Example (requires org.testcontainers:testcontainers and org.testcontainers:postgresql):
        @Container
        static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                .withDatabaseName("testdb")
                .withUsername("test")
                .withPassword("test");

        @DynamicPropertySource
        static void setDatasourceProperties(DynamicPropertyRegistry registry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
        */
    }
}
