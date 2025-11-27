# slowfall — README

This repository contains the slowfall backend and frontend. Below are notes on logging configuration and the new
aspect-based logging utilities.

## Automatic method-level logging (LoggingAspect)

We provide a configurable AOP-based logging aspect that can automatically log entry/exit and exceptions for methods in
the application.

Configuration properties (application.properties / application.yml):

- `app.logging.aspect.enabled` (boolean, default `true`) — enable or disable the aspect.
- `app.logging.aspect.mode` (string, default `SERVICES`) — which methods to log. Allowed values:
    - `ALL` — log all public methods under `xyz.soda.slowfall..`
    - `SERVICES` — log only service-layer methods (package contains `.service`)
    - `ANNOTATED` — only log methods or classes annotated with `@Loggable`
- `app.logging.aspect.exclude-packages` (comma-separated list) — package prefixes to exclude from automatic logging.

Examples:

```properties
# Enable aspect, but only for service layer
app.logging.aspect.enabled=true
app.logging.aspect.mode=SERVICES

# Exclude infra and generated packages
app.logging.aspect.exclude-packages=xyz.soda.slowfall.infra,xyz.soda.slowfall.generated
```

## Opt-in annotation `@Loggable`

You can annotate a class or a method with `xyz.soda.slowfall.infra.logging.Loggable` to enable logging when the aspect
is set to `ANNOTATED` mode.

Usage example:

```java
import xyz.soda.slowfall.infra.logging.Loggable;

@Loggable
@Service
public class MyService {
    public void doWork() {
        // method calls will be logged by the aspect when enabled
    }
}
```

## MDC (traceId / userId)

A servlet filter `RequestLoggingFilter` is included. It reads request headers and populates SLF4J MDC keys `traceId` and
`userId`:

- `X-Request-Id` or `X-Trace-Id` → `traceId` (generated UUID fallback)
- `X-User-Id` → `userId` (optional)

This lets Logstash encode these MDC values in JSON logs.

## How to use

- For local development, keep the aspect enabled and mode `SERVICES` (default).
- For production, consider `ANNOTATED` mode and selectively annotate methods/classes you want traced.

## Where to look in the repository

- `src/main/java/xyz/soda/slowfall/infra/logging/LoggingAspect.java` — the aspect implementation
- `src/main/java/xyz/soda/slowfall/infra/logging/Loggable.java` — opt-in annotation
- `src/main/java/xyz/soda/slowfall/infra/logging/RequestLoggingFilter.java` — MDC population filter
- `src/main/resources/logback-spring.xml` — Logback configuration using Logstash encoder

---

**Security note:** Do not commit secrets into the repository. Treat `.env.example` as a template only.

If you want to persist variables for the user, use `setx` (Windows) or a more suitable secret manager for production.

```
./gradlew bootRun --args="--spring.profiles.active=prod"
# then run (example):

}
  }
    if ($parts.Length -eq 2) { Set-Item -Path Env:$($parts[0].Trim()) -Value $parts[1].Trim() }
    $parts = $_ -split '=', 2
  if ($_ -and -not $_.TrimStart().StartsWith('#')) {
Get-Content .env.example | ForEach-Object {
```powershell

This repository includes a `.env.example` file you can copy and adapt for local testing. PowerShell does not automatically load `.env` files; you can import it into the current session with this one-liner (temporary for the session):

## Using a `.env` file (example)

```

./gradlew bootRun

```powershell

Run in development (console logging):

```

$env:LOGSTASH_HOST='localhost'; $env:LOGSTASH_PORT='5000'; ./gradlew bootRun --args="--spring.profiles.active=prod-udp"

```powershell

Run the UDP example profile:

```

$env:LOGSTASH_HOST='localhost'; $env:LOGSTASH_PORT='5000'; ./gradlew bootRun --args="--spring.profiles.active=prod"

```powershell

Set environment variables for a single command and run with the `prod` profile (TCP):

## Example: run locally (PowerShell)

- Spring Boot logging (3.5.7) — Logging System: https://docs.spring.io/spring-boot/docs/3.5.7/reference/html/features.html#features.logging
- Logstash Logback Encoder — Usage: https://github.com/logstash/logstash-logback-encoder#usage
References:

The Logback config includes selected MDC fields (for example: `traceId` and `userId`) in the JSON output. Populate these MDC values from your application code using SLF4J `MDC.put(...)` before logging. See SLF4J MDC docs: https://www.slf4j.org/manual.html#mdc

- `LOGSTASH_PORT` — port of the Logstash endpoint (default: `5000`)
- `LOGSTASH_HOST` — host of the Logstash endpoint (default: `localhost`)
Environment variables used by the Logback configuration:

- `!prod` (default for development) — logs to the console in a human-readable format.
- `prod-udp` — example configuration that sends JSON-formatted logs to Logstash over UDP (`LogstashUdpSocketAppender`). Activate this only if your Logstash endpoint expects UDP.
- `prod` — sends JSON-formatted logs to a Logstash TCP endpoint using `LogstashTcpSocketAppender`, wrapped with an `AsyncAppender` for throughput.
Profiles provided in the repository:

We use a profile-aware Logback configuration file at `src/main/resources/logback-spring.xml`.

## Logging & Spring profiles

This repository contains the slowfall backend and frontend. This README provides a short guide for the logging configuration and how to run the application with different Spring profiles and environment variables.
