package xyz.soda.slowfall;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import xyz.soda.slowfall.config.StartupPropertySourcesLogger;

@SpringBootApplication
@EnableJpaAuditing
public class SlowfallApplication {

    /**
     * Application entry point for the Slowfall Spring Boot application.
     *
     * @param args runtime arguments passed to the JVM
     */
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(SlowfallApplication.class);
        // Register startup listeners that help debug property sources and failures
        app.addListeners(new StartupPropertySourcesLogger());
        app.run(args);
    }
}
