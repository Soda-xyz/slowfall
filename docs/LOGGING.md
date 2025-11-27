Controlling logs for developers

This short note explains how to control logging verbosity for local development and troubleshooting.

Why

- The project’s non-prod Logback configuration sets the root logger to DEBUG, and Hibernate SQL printing can produce
  very noisy console output.

Files you may edit

- `src/main/resources/application.properties` (per-developer / per-run overrides using Spring properties)
- `src/main/resources/logback-spring.xml` (central Logback configuration; more structural)

Quick runtime overrides (no file edits)

- Run with system properties to change levels for a single run (PowerShell examples):

```powershell
# Set root to INFO and disable Hibernate SQL printing
.\gradlew.bat bootRun -Dlogging.level.root=INFO -Dspring.jpa.show-sql=false

# Keep app package DEBUG but silence Spring framework and Hibernate SQL
.\gradlew.bat bootRun -Dlogging.level.xyz.soda.slowfall=DEBUG -Dlogging.level.org.springframework=INFO -Dlogging.level.org.hibernate.SQL=ERROR -Dspring.jpa.show-sql=false
```

Persistent, per-developer setting (recommended)

- Add (or confirm) these in `src/main/resources/application.properties`:

```properties
# Keep framework noise low
logging.level.root=INFO
logging.level.org.springframework=INFO
# Keep your app package at DEBUG so you see app logs
logging.level.xyz.soda.slowfall=DEBUG
# Prevent Hibernate from printing every SQL statement
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=ERROR
```

Notes

- `spring.jpa.show-sql=true` forces SQL prints from Hibernate regardless of logger levels; prefer `false` and control
  SQL logging via `logging.level.org.hibernate.SQL`.
- Properties set in `application.properties` can be overridden by system properties or environment variables at runtime.

Change the Logback default (alternative)

- If you want a structural change for all non-`prod` runs, edit `src/main/resources/logback-spring.xml` and change the
  `!prod` profile root level from `DEBUG` to `INFO`:
    - Open the `<springProfile name="!prod">` section and change `<root level="DEBUG">` to `<root level="INFO">`.
    - This centrally reduces noise for all non-prod profiles.

Useful references (Spring Boot 3.5.7)

- Logging overview and
  `logging.level.*`: https://docs.spring.io/spring-boot/docs/3.5.7/reference/htmlsingle/#features.logging.levels
- Logback & `logback-spring.xml`
  support: https://docs.spring.io/spring-boot/docs/3.5.7/reference/htmlsingle/#howto.logging.logback
- JPA / Hibernate `spring.jpa.show-sql`: https://docs.spring.io/spring-boot/docs/3.5.7/reference/htmlsingle/#data.sql

Verification

- Start the app and observe reduced output:

```powershell
.\gradlew.bat bootRun
```

- Test runtime overrides without editing files:

```powershell
.\gradlew.bat bootRun -Dlogging.level.root=INFO -Dlogging.level.xyz.soda.slowfall=DEBUG -Dlogging.level.org.hibernate.SQL=ERROR -Dspring.jpa.show-sql=false
```

Next steps

- If you'd like, I can:
    - Update `logback-spring.xml` to change the non-prod default from DEBUG -> INFO (structural change), or
    - Add a short note to the project `README.md` instead of `docs/LOGGING.md`.


