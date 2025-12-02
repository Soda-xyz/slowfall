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
- [Environment & Deployment](#environment--deployment-brief)
- [Azure Front Door & Key Vault TLS](#azure-front-door--key-vault-tls)

# Formatters & Linters — Backend (Gradle / Java)

Copyable commands (run from repo root):

```bash
# apply Spotless formatting to Java sources
./gradlew spotlessApply
```

```bash
# run Spotless check (verify formatting)
./gradlew spotlessCheck
```

```bash
# run Checkstyle for main and test sources
./gradlew checkstyleMain checkstyleTest
```

> Full project README follows below.

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

## Azure Front Door & Key Vault TLS

Recommended deployment pattern: terminate public TLS at Azure Front Door and use Azure Key Vault as the single source of
truth for certificates and signing keys.

Why this repo follows that pattern

- Centralizes certificate lifecycle (provisioning and rotation) at the CDN/edge layer (Front Door).
- Avoids shipping server keystores inside container images or environment variables.
- Keeps JWT signing keys and token lifecycle in Key Vault (single source of truth).

High-level steps

1. Create an Azure Front Door (Standard/Premium) profile and add a backend pool that points to your application (App
   Service, AKS ingress, VM, or IP).
2. Add a custom domain to Front Door and validate ownership (CNAME DNS validation).
3. Configure HTTPS for the custom domain:
    - Option A (recommended): Use Front Door-managed certificates (Front Door issues and auto-renews TLS certs).
    - Option B: Use a certificate stored in Key Vault (upload PFX to Key Vault and give Front Door access to read the
      secret/certificate). See Front Door docs for Key Vault integration.
4. Configure routing rules and WAF policies as needed.
5. Test end-to-end and switch DNS to point to Front Door.

App configuration notes (what we changed in this repo)

- Production configuration disables in-app server TLS. See `src/main/resources/application-prod.properties`:

```properties
# TLS is terminated at Azure Front Door
server.ssl.enabled=false
server.port=${PORT:8080}
```

- Key Vault is used for JWT signing keys. Relevant Spring properties (set via environment or
  `application-*.properties`):

    - `app.security.azure.keyvault.vault-url` — e.g. `https://{your-vault}.vault.azure.net/`
    - `app.security.azure.keyvault.key-name` — name of the Key Vault Key used for signing (preferred)
    - `app.security.azure.keyvault.secret-name` — alternative: secret containing PEM private key (if you store PEM in
      Secrets)
    - `AZURE_KEYVAULT_ENABLE` — set to `true` in production to enable Key Vault-backed beans and behavior

Authentication to Key Vault

- In Azure: prefer Managed Identity for the application (no client secret required). Grant the identity `get`
  permissions on keys/secrets/certificates as needed.
- Local dev: DefaultAzureCredential will fallback to developer credentials (Azure CLI) or use these env vars as a
  service principal:
    - `azure_client_id`
    - `azure_client_secret`
    - `azure_tenant_id`

Health checks and probes

- Front Door health probe path should be configured (e.g., `/actuator/health`) and must be accessible without
  authentication or with a probe-specific header the backend accepts.
- The container image `HEALTHCHECK` remains `http://localhost:${PORT}/actuator/health` for container runtime monitoring.

Security & rotation notes

- JWT signing keys must still be rotated and published to a JWKS endpoint or available to resource servers via Key
  Vault.
- If you need end-to-end TLS (Front Door -> backend HTTPS), you must provide a backend certificate (Key Vault or local)
  and configure the backend to trust it. This reintroduces keystore handling inside the app; prefer Front Door-managed
  certs unless your policy requires otherwise.

Useful docs

- Azure Front Door: https://learn.microsoft.com/azure/frontdoor/
- Front Door HTTPS & Key Vault
  integration: https://learn.microsoft.com/azure/frontdoor/standard-premium/secure-frontend-using-ssl
- Front Door + Key Vault
  certificates: https://learn.microsoft.com/azure/frontdoor/standard-premium/how-to-front-door-use-certificate-in-key-vault
- Spring Boot SSL config (why server.ssl.* is safe to disable when using Front
  Door): https://docs.spring.io/spring-boot/docs/3.5.7/reference/htmlsingle/#howto-configure-ssl
