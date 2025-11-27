package xyz.soda.slowfall.config;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import xyz.soda.slowfall.airport.domain.Airport;
import xyz.soda.slowfall.airport.infra.AirportRepository;
import xyz.soda.slowfall.craft.domain.Craft;
import xyz.soda.slowfall.craft.infra.CraftRepository;
import xyz.soda.slowfall.person.domain.Person;
import xyz.soda.slowfall.person.infra.PersonRepository;

/**
 * Seeds initial data for the application on startup.
 *
 * <p>This configuration defines a {@link CommandLineRunner} bean that will insert
 * a small set of airports, crafts and people when the application starts and the
 * corresponding repositories are empty. It is safe to run multiple times because
 * insertion is guarded by repository counts.</p>
 */
@Configuration
public class DataSeeder {

    /**
     * Create a startup runner that seeds example airports, crafts and people.
     *
     * @param airportRepository repository used to persist airports
     * @param craftRepository   repository used to persist crafts
     * @param personRepository  repository used to persist people
     * @return a {@link CommandLineRunner} which performs the seeding when run
     */
    @Bean
    public CommandLineRunner seedData(
            AirportRepository airportRepository, CraftRepository craftRepository, PersonRepository personRepository) {
        return args -> {
            if (airportRepository.count() == 0) {
                var a1 = new Airport("EGLL", "London Heathrow", "Europe/London");
                var a2 = new Airport("EGGW", "London Stansted", "Europe/London");
                airportRepository.saveAll(List.of(a1, a2));
            }

            if (craftRepository.count() == 0) {
                var c1 = new Craft("Cessna 182", "N182EX", 1000, 4);
                var c2 = new Craft("Pilatus PC-6", "HB-PC6", 1200, 6);
                craftRepository.saveAll(List.of(c1, c2));
            }

            if (personRepository.count() == 0) {
                // Interpret the user's request as 4 people:
                // 1: pilot and skydiver (pilot=true, skydiver=true)
                // 2: pilot only (pilot=true, skydiver=false)
                // 3-4: skydivers only (pilot=false, skydiver=true)
                var p1 = new Person("Alice", "Anderson", true, true, 70, "alice@example.com");
                var p2 = new Person("Bob", "Brown", true, false, 85, "bob@example.com");
                var p3 = new Person("Carol", "Clark", false, true, 60, "carol@example.com");
                var p4 = new Person("Dave", "Doe", false, true, 78, "dave@example.com");
                personRepository.saveAll(List.of(p1, p2, p3, p4));
            }
        };
    }
}
