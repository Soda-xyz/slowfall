# slowfall — README

This repository contains the slowfall backend and frontend. Below are concise notes for developers and pointers to
environment and deployment documentation.

## Overview

slowfall is a Java Spring Boot backend with a TypeScript/React frontend. This README contains developer-facing
information (logging, the AOP logging aspect, and repository pointers). See `README_ENV.md` for environment variables
and `README_CLOUD.md` for cloud deployment and IaC guidance. The `LocalFiles/README_AZURE_MIGRATION.md` (local-only) has
concise migration requirements and implementation notes for the Entra migration and nginx proxy.

## Quick links

- Environment & secrets: `README_ENV.md`
- Cloud deployment & Key Vault: `README_CLOUD.md`
- Azure migration notes (local-only): `LocalFiles/README_AZURE_MIGRATION.md`

## Authentication and Proxy (current architecture)

- Authentication: Entra (Azure AD) is the primary identity provider (OIDC) for frontend and backend in production. The
  backend validates incoming bearer tokens issued by Entra. HTTP Basic remains allowed only for development-like profiles
  (dev/pseudo) and should not be enabled in production.
- Reverse proxy: A dedicated nginx reverse proxy (`slowfall-proxy`) runs as its own App Service container in the
  recommended architecture. The proxy is responsible for TLS termination (if used), header forwarding, cookie preservation,
  and mapping `/api/` requests to the backend host. The proxy reads `BACKEND_HOST` and related settings from App Service
  app settings.

See `README_CLOUD.md` for the canonical cloud deployment steps, CI/Credentials, and Key Vault guidance.

## Where to look in the repository

- `src/main/java/xyz/soda/slowfall/infra/logging/LoggingAspect.java`
- `src/main/java/xyz/soda/slowfall/infra/logging/Loggable.java`
- `src/main/java/xyz/soda/slowfall/infra/logging/RequestLoggingFilter.java`
- `src/main/resources/logback-spring.xml`

(Developer tooling and build instructions unchanged.)

## Security note

Do not commit secrets into the repository. Use Key Vault and GitHub repository secrets, and prefer OIDC-based federated
credentials for CI where possible.
