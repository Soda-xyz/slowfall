# SECURITY — production key management and dev/prod differences

This document explains how the application handles JWT signing keys and dev/prod differences, and how to provide a production keystore (JKS/PKCS12).

Overview
--------
- In `dev` profile the application generates a temporary (ephemeral) RSA key at startup. This is convenient for local development and tests but is NOT secure for production.
- For production, provide a stable private key in a keystore and configure the application with `app.security.jks.*` properties (see below) so the application loads a persistent RSA key at startup.

Configuration
-------------
- `application-dev.properties` (already present) contains safe development defaults:
  - `app.security.dev-bypass=true` — enables the development bypass filter (also active when profile `dev` is active).
  - `app.cors.allowed-origins` — list of allowed origins for local frontends.
  - `app.security.cookie-secure=false` — local testing without TLS.

- `application-prod.properties` (example) demonstrates how to configure the production keystore and cookie behavior.

Production keystore (recommended)
---------------------------------
Provide the following properties in your production environment (securely) or package them into `application-prod.properties` (not recommended for secrets):

- `app.security.jks.path` — path to the JKS/PKCS12 keystore file readable by the application.
- `app.security.jks.password` — keystore password.
- `app.security.jks.alias` — alias of the private key entry to use for signing.
- `app.security.jks.key-password` — (optional) password for the private key entry if different from the keystore password.

The application will load the private key and public certificate and expose it as an RSAKey bean. When `app.security.jks.path` is set the application will use this key instead of the dev ephemeral RSA key.

Cookie settings
---------------
- Control cookie behavior with these properties:
  - `app.security.cookie-secure` (true/false)
  - `app.security.cookie-name` (defaults to `refresh_token`)
  - `app.security.cookie-same-site` (Lax, Strict, None)

Dev vs Prod checklist
---------------------
- Dev
  - Run with `--spring.profiles.active=dev` or using `bootRunDev`.
  - `app.security.dev-bypass` may be enabled for local convenience.
  - CORS allowed origins are configured in `application-dev.properties`.

- Prod
  - Provide `app.security.jks.path`, `app.security.jks.password`, and `app.security.jks.alias`.
  - Ensure `app.security.cookie-secure=true` and `app.security.cookie-same-site=None` when cross-site cookies over TLS are required.
  - Disable `app.security.dev-bypass`.

References
----------
- Spring Boot profiles: https://docs.spring.io/spring-boot/docs/3.5.7/reference/html/features.html#features.profiles
- Spring Security CORS: https://docs.spring.io/spring-security/reference/servlet/exploits/cors/
- Nimbus JOSE + JWT (used by Spring Security): https://connect2id.com/products/nimbus-jose-jwt

