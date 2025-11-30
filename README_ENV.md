# Environment & Secrets (README_ENV.md)

This file lists exactly which environment variables and CI/CD secrets must be set for production. Use these names and
values (examples) in App Service application settings or your container orchestration environment.

Important: this project uses Azure Key Vault Keys for signing and a Managed Identity on the backend App Service to
access Key Vault. CI (deployment) uses GitHub Actions with OIDC-based federated credentials to perform `az` commands.

Required production environment variables (exact names and examples)

1. ALLOWED_ORIGINS
    - Purpose: Comma-separated list of allowed frontend origins for CORS.
    - Example value: `https://app.example.com,https://admin.example.com`
    - Where to set: App Service -> Configuration -> Application settings (Name = `ALLOWED_ORIGINS`).
    - Spring property mapping: `app.cors.allowed-origins=${ALLOWED_ORIGINS}`

2. SPRING_PROFILES_ACTIVE
    - Purpose: Ensure the `prod` Spring profile is active.
    - Example value: `prod`
    - Where to set: App Service app setting (Name = `SPRING_PROFILES_ACTIVE`) or injected by your container runtime.
    - Effect: Activates `application-prod.properties` behaviour.

3. APP_SECURITY_AZURE_KEYVAULT_VAULT_URL
    - Purpose: URL of the Azure Key Vault used for signing keys.
    - Example value: `https://slowfall-kv.vault.azure.net/`
    - Where to set: App Service app setting (Name = `APP_SECURITY_AZURE_KEYVAULT_VAULT_URL`).
    - Spring property mapping: `app.security.azure.keyvault.vault-url` (bound from env var above).

4. APP_SECURITY_AZURE_KEYVAULT_KEY_NAME
    - Purpose: Name of the Key Vault Key used for signing (Key resource, not a secret).
    - Example value: `slowfall-sign-key`
    - Where to set: App Service app setting (Name = `APP-SECURITY-AZURE-KEYVAULT-KEY-NAME`).
    - Spring property mapping: `app.security.azure.keyvault.key-name` (bound from env var above).

5. APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST
    - Purpose: Whether the app should fail startup if Key Vault is unavailable.
    - Example value: `true`
    - Where to set: App Service app setting (Name = `APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST`).
    - Spring property mapping: `app.security.azure.keyvault.fail-fast` (true/false)

6. APP_SECURITY_AZURE_KEYVAULT_CREDENTIALS_SECRET_NAME
    - Purpose: Name of the Key Vault Secret that contains the single allowed username and BCrypt password hash (JSON or
      separate secret). Default: `slowfall-credentials`.
    - Example (JSON value): `{"username":"alice","passwordHash":"$2a$10$..."}`
    - Where to set: App Service application setting (Name = `APP_SECURITY_AZURE_KEYVAULT_CREDENTIALS_SECRET_NAME`) or
      set via the `app.security.azure.keyvault.credentials-secret-name` property.
    - Spring property mapping: `app.security.azure.keyvault.credentials-secret-name`

CI / GitHub Actions secrets (exact names)

These secrets are required by the GitHub Actions workflow to build/push images and perform Azure CLI deployment steps.
This project uses OIDC-based federated credentials for Azure login; no client secrets are stored in the repository.

- `AZURE_CLIENT_ID` — service principal client id (used by OIDC login)
- `AZURE_TENANT_ID` — tenant id
- `AZURE_SUBSCRIPTION_ID` — Azure subscription id
- `AZURE_RG` — Azure resource group name (used in deploy steps)
- `BACKEND_APP_NAME` — backend App Service name (used in deploy steps)
- `FRONTEND_APP_NAME` (optional) — frontend App Service name
- `ALLOWED_ORIGINS` — (optional) production ALLOWED_ORIGINS value to be set by the deploy pipeline

References

- Azure Key Vault Keys: https://learn.microsoft.com/azure/key-vault/keys/about-keys
- DefaultAzureCredential (
  Java): https://learn.microsoft.com/java/api/com.azure.identity.defaultazurecredentialbuilder?view=azure-java-stable

## Which app needs which

This section maps each environment variable and CI/GitHub Actions secret to the application or system that needs it.

- ALLOWED_ORIGINS — Backend (required). Used by the backend Spring app for CORS via `app.cors.allowed-origins`. Set as
  an App Service application setting (or container env) for the backend. The CI/deploy pipeline may also provide this
  value (see CI secrets) to update backend and/or frontend configuration during deployment.

- SPRING_PROFILES_ACTIVE — Backend (required). Controls the active Spring profile (for production set `prod`). Set as an
  App Service app setting for the backend.

- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL — Backend (required). URL of the Azure Key Vault used by the backend to fetch
  signing keys.

- APP_SECURITY_AZURE_KEYVAULT_KEY_NAME — Backend (required). Name of the Key Vault Key the backend uses for signing.

- APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST — Backend (optional). Controls whether the backend should fail startup if Key
  Vault cannot be reached; default behavior depends on application configuration.

- APP_SECURITY_AZURE_KEYVAULT_CREDENTIALS_SECRET_NAME — Backend (required). Name of the Key Vault Secret containing the
  credentials for the backend service.

CI / GitHub Actions secrets (used by the deploy pipeline only)

The secrets below are consumed only by the CI/deployment workflows (GitHub Actions) to build, push images, and perform
Azure CLI deployment steps. They are not required as runtime environment variables inside the running backend App
Service unless you explicitly choose to propagate them there.

- AZURE_CLIENT_ID — CI (required for OIDC-based deployments).
- AZURE_TENANT_ID — CI (required for OIDC-based deployments).
- AZURE_SUBSCRIPTION_ID — CI (required by deployment scripts).
- AZURE_RG — CI (resource group used by deployment scripts).
- BACKEND_APP_NAME — CI (name of the backend App Service to target during deploy).
- FRONTEND_APP_NAME — CI (optional; name of the frontend App Service to target during deploy).
- ALLOWED_ORIGINS — CI (optional; the deploy pipeline can set this value into the backend/frontend App Service
  configuration).

Notes

- All Backend entries above should be set as App Service Application settings (or container environment variables) for
  the backend App Service instance that runs the Java Spring Boot application.
- FRONTEND runtime configuration: this repository's frontend is typically served from a separate App Service or static
  hosting. If you need runtime environment values in the frontend (for example a different API URL), prefer build-time
  injection or the hosting provider's configuration mechanism; only set frontend-specific environment variables on the
  frontend hosting resource (see `FRONTEND_APP_NAME` for deploy-time naming).
- There is an inconsistency in naming styles in this file (some vars use underscores, one uses hyphens). Use the exact
  names shown here when configuring App Service application settings or GitHub Secrets — env var names are
  case-sensitive in many CI systems and Linux containers.
