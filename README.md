# slowfall — README

This repository contains the slowfall backend and frontend. Below are concise notes for developers and pointers to
environment and deployment documentation.

## Overview

slowfall is a Java Spring Boot backend with a TypeScript/React frontend. This README contains developer-facing
information (logging, the AOP logging aspect, and repository pointers). See `README_ENV.md` for environment variables
and secrets, and `README_CLOUD.md` for cloud deployment and Key Vault setup.

## Quick links

- Environment & secrets: `README_ENV.md`
- Cloud deployment & Key Vault: `README_CLOUD.md`
- Additional docs: `docs/CONFIG.md`, `docs/LOGGING.md`, `docs/SECURITY.md`, `README_KEYVAULT.md`, `DEPLOY.md`

## Table of contents

- [Overview](#overview)
- [Quick links](#quick-links)
- [Automatic method-level logging (LoggingAspect)](#automatic-method-level-logging-loggingaspect)
- [Opt-in annotation `@Loggable`](#opt-in-annotation-loggable)
- [MDC (traceId / userId)](#mdc-traceid--userid)
- [Where to look in the repository](#where-to-look-in-the-repository)
- [Environment & Deployment](#)

## Automatic method-level logging (LoggingAspect)

We provide a configurable AOP-based logging aspect that can automatically log entry/exit and exceptions for methods in
the application.

Configuration properties:

- `app.logging.aspect.enabled` (boolean, default `true`) — enable or disable the aspect.
- `app.logging.aspect.mode` (string, default `SERVICES`) — which methods to log. Allowed values:
    - `ALL` — log all public methods under `xyz.soda.slowfall..`
    - `SERVICES` — log only service-layer methods (package contains `.service`)
    - `ANNOTATED` — only log methods or classes annotated with `@Loggable`
- `app.logging.aspect.exclude-packages` (comma-separated list) — package prefixes to exclude from automatic logging.

Example:

```properties
app.logging.aspect.enabled=true
app.logging.aspect.mode=SERVICES
app.logging.aspect.exclude-packages=xyz.soda.slowfall.infra,xyz.soda.slowfall.generated
```

## Opt-in annotation `@Loggable`

Annotate a class or method with `xyz.soda.slowfall.infra.logging.Loggable` to enable logging when the aspect is set to
`ANNOTATED` mode.

Usage example (Java):

```java
@Loggable
@Service
public class MyService {
    public void doWork() {
        // method calls will be logged by the aspect when enabled
    }
}
```

## MDC (traceId / userId)

A servlet filter `RequestLoggingFilter` reads request headers and populates SLF4J MDC keys `traceId` and `userId`:

- `X-Request-Id` or `X-Trace-Id` → `traceId` (generated UUID fallback)
- `X-User-Id` → `userId` (optional)

These MDC values are included in JSON logs by the logback config.

## Where to look in the repository

- `src/main/java/xyz/soda/slowfall/infra/logging/LoggingAspect.java`
- `src/main/java/xyz/soda/slowfall/infra/logging/Loggable.java`
- `src/main/java/xyz/soda/slowfall/infra/logging/RequestLoggingFilter.java`
- `src/main/resources/logback-spring.xml`

## Environment & Deployment (brief)

- The CI/CD pipeline uses OIDC-based federated credentials for Azure deployments (no client secrets are required). See
  `README_ENV.md` and `README_CLOUD.md` for full details.
- The frontend image now bakes the backend proxy target at build time using a `BACKEND_HOST` build-arg; the pipeline
  passes the `BACKEND_APP_NAME` secret as `BACKEND_HOST` during the frontend image build.

---

**Security note:** Do not commit secrets into the repository. See `README_ENV.md` for details on environment variables,
keystores, and CI/CD secret names.
