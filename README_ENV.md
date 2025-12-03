# Environment & Secrets (README_ENV.md)

This file is the canonical source of truth for where to set environment variables, repository secrets, Key Vault entries,
and build-time arguments for the slowfall project. Each section below groups variables by *where* they should be configured
so operators and developers know the authoritative location to set values.

Note: If you rename or add any variable or secret, update this file and `README_CLOUD.md` / `infra/DEPLOY.md` so CI and
operators remain consistent.

---

Recorded provision values (non-secret)
- BACKEND_APP_ID=628940e9-8851-4a41-a023-ca8183a04263
- FRONTEND_APP_ID=ce0f64ea-3635-4be7-ad93-7954f04cfa83
- Key Vault secret (credentials) name: `slowfall-backend-client-secret`
- Key Vault URI (example): `https://slowfall-keyvault-next.vault.azure.net/`
- Public proxy domain (frontend): `https://www.oskarnilsson.net` (set as `ALLOWED_ORIGINS` for CORS)
- AAD group for web users (GUID): `SLOWFALL_WEB_USERS_GROUP_ID=1dea5e51-d15e-4081-9722-46da3bfdee79`
- Test user (member account, non-secret record): `kisse@Sodezangmail.onmicrosoft.com` (created for testing only)

Note: Do NOT store raw secret values in the repository. Store secret names, appIds, Key Vault URIs and group ids here as a reference; actual secret values should remain in Key Vault or GitHub Actions secrets.

---

Runtime App Service app settings to add (set in Azure Portal -> App Service -> Configuration -> Application settings)
- SLOWFALL_WEB_USERS_GROUP_ID (recommended)
  - Purpose: The GUID of the AAD security group whose members are allowed to access the application (used by backend to enforce group-based access).
  - Example: `1dea5e51-d15e-4081-9722-46da3bfdee79`
  - How it's consumed: the backend can read this from the environment (for example map to `app.security.allowed-group-id`) and use it in security checks instead of hard-coding GUIDs.

- Alternative property name (Spring property): `app.security.allowed-group-id`
  - Purpose: If you prefer to bind config via Spring properties, set `app.security.allowed-group-id` in your App Service app settings (or in `application-prod.properties`). The application code can then read this property and use it in authorization checks.

Recommendation
- Add `SLOWFALL_WEB_USERS_GROUP_ID` as a GitHub Actions repository secret with the AAD group GUID value (non-secret value). CI will use that secret and write it into the backend App Service as the app setting `APP_SECURITY_ALLOWED_GROUP_ID` during deploy.

How CI maps the secret to runtime
- Repository secret: `SLOWFALL_WEB_USERS_GROUP_ID` (set in GitHub → Settings → Secrets → Actions)
- CI will write this value as an App Service app setting named `APP_SECURITY_ALLOWED_GROUP_ID` for the backend app so Spring Boot picks it up via `app.security.allowed-group-id`.

Example (what to set):
- GitHub secret: `SLOWFALL_WEB_USERS_GROUP_ID=1dea5e51-d15e-4081-9722-46da3bfdee79`
- After CI runs, App Service backend app setting: `APP_SECURITY_ALLOWED_GROUP_ID=1dea5e51-d15e-4081-9722-46da3bfdee79`

Operational note
- To rotate or change the allowed group, update the GitHub secret and run the deploy workflow; CI will update the App Service setting automatically.

Security & operational notes
- The group GUID is not a secret, but keep it under controlled documentation so operators don't accidentally change it. The canonical source of truth should be this README and your infra IaC (Bicep/ARM/Terraform) where applicable.
- If you change the group, update `SLOWFALL_WEB_USERS_GROUP_ID` in App Service app settings and any CI references, and record the change in this file and `README_CLOUD.md`.

---

GitHub Actions / Repository secrets (set in GitHub → Settings → Secrets → Actions)

IMPORTANT: OIDC-ONLY policy
- This repository and CI are configured to use Azure AD OIDC (federated credential) for GitHub Actions. Do not rely on long-lived client secrets for automated CI deploys. The workflow uses `azure/login` with a federated credential; that is the required auth mechanism for deployments.

Required secrets (must exist for CI to deploy)
- AZURE_CLIENT_ID — Azure AD application (app registration) id that has a federated credential for this repository/branch (used by `azure/login`).
- AZURE_TENANT_ID — Azure tenant id used for Azure login.
- AZURE_SUBSCRIPTION_ID — Azure subscription id used by `az` operations.
- AZURE_RG — Azure resource group where App Services and Key Vault exist (e.g., `slowfall-appservice-prod`).
- BACKEND_APP_NAME — Backend App Service name (e.g., `slowfall-backend`).
- FRONTEND_APP_NAME — Frontend App Service name (e.g., `slowfall-frontend`).
- DEPLOY_ENV — Deployment environment name used by CI (e.g., `prod`).
- SLOWFALL_WEB_USERS_GROUP_ID — AAD group GUID used by the app (CI writes it to App Service as `APP_SECURITY_ALLOWED_GROUP_ID`).
- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL — Full vault URI (e.g. `https://slowfall-keyvault-next.vault.azure.net/`). THIS IS REQUIRED: the CI/workflow and runtime will use this secret to configure Key Vault access; the workflow no longer falls back to a hardcoded URI.
- ALLOWED_ORIGINS — optional comma-separated allowed origins used for CORS (CI will write it into app settings if present).

Secrets you may remove (NOT used by current OIDC workflow)
- AZURE_CLIENT_SECRET — not used by the OIDC-based workflow. Remove this secret to reduce risk.
- AZURE_CREDENTIALS — not used by the workflow (legacy JSON credential). Remove if you exclusively use OIDC.
- BACKEND_APP_ID — not used by the CI workflow (kept in README for reference). If you stored it as a GitHub secret and it’s not used by other processes, remove it.

How to remove (example gh CLI commands)
- gh secret remove AZURE_CLIENT_SECRET --repo Soda-xyz/slowfall
- gh secret remove AZURE_CREDENTIALS --repo Soda-xyz/slowfall
- gh secret remove BACKEND_APP_ID --repo Soda-xyz/slowfall

Note: before removing any secret, verify no other workflow or external system depends on it.

---

App Service — Runtime App Settings (set in Azure Portal / App Service -> Configuration -> Application settings)
- SPRING_PROFILES_ACTIVE
  - Purpose: Spring profile for backend runtime (e.g., `prod`, `dev`). CI sets this during deploy when `DEPLOY_ENV` is present.
  - Example: `prod`

- ALLOWED_ORIGINS
  - Purpose: Comma-separated list used by the backend for CORS (maps to `app.cors.allowed-origins`).
  - Example: `https://slowfall-frontend.azurewebsites.net`

- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL
  - Purpose: Full Key Vault URI used by the apps. The workflow now *requires* this secret to be set in GitHub and will fail early if it is missing. Do not rely on defaults in CI.
  - Example: `https://slowfall-keyvault-next.vault.azure.net/`

- APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST
  - Purpose: When true the application will fail startup if required Key Vault secrets/keys are not accessible. Useful in production. If the app is failing on startup due to Key Vault, temporarily set this to `false` while you fix RBAC.

- Any other runtime setting described earlier in this README should be set here as needed.

---

Build-time / CI / Docker build-args (set at build-time in CI or local docker build args)
- VITE_FRONTEND_ENV
  - Purpose: Vite build mode passed into the frontend build (`production` or `development`). CI sets this based on `DEPLOY_ENV`.
  - Example: `production`

- VITE_API_BASE_URL
  - Purpose: Vite API base URL baked into the SPA at build-time. The production default is intentionally empty so the SPA uses relative paths like `/api/...`.
  - Example (production): empty string `""`; Example (dev): `http://localhost:8080`

- VITE_MSAL_CLIENT_ID (build-time)
  - Purpose: Client id for Entra (Azure AD) SPA integration; baked into the SPA at build-time.
  - Example: `e4b1a2c3-...`

- VITE_MSAL_TENANT_ID or VITE_MSAL_AUTHORITY (build-time)
  - Purpose: Tenant id or full authority URL for MSAL; set at build-time so SPA is compiled with the correct authority.

- VITE_MSAL_REDIRECT_URI (optional, build-time)
  - Purpose: Redirect/callback URI baked into SPA during build.

- VITE_MSAL_BACKEND_CLIENT_ID (optional, build-time)
  - Purpose: Backend API client id used to compute scopes like `api://<client-id>/access_as_user`.

- SPRING_PROFILES_ACTIVE (as a Docker build-arg for backend image)
  - Purpose: CI may pass this as a build-arg to bake a default Spring profile into the image; App Service runtime app settings can still override it.
  - Example: `prod`

- BACKEND_HOST (build-arg used by frontend Dockerfile / nginx template)
  - Purpose: Host baked into frontend/nginx configs to proxy API calls to the backend.
  - Example: `slowfall-backend.azurewebsites.net`

---

Key Vault entries (create in Key Vault — prefer Key Vault + managed identities rather than committing secrets)
- slowfall-credentials (example secret name)
  - Purpose: Optional secret containing production backend credentials when a simple single-login approach is used. Prefer JSON with `{"username":"...","passwordHash":"..."}` or use other secure credential stores for multi-user setups.

- slowfall-sign-key (example Key name)
  - Purpose: Key used for signing operations if the backend uses Key Vault Keys for JWT signing.

- Other keys/secrets
  - Purpose: Store any client secrets, certs, or runtime configuration values that must remain secret. Use Key Vault RBAC and assign the backend's / proxy's system-assigned managed identity appropriate roles (Secrets User, Crypto User when needed).

---

Local development overrides (set locally / in your shell or dev environment)
- SPRING_PROFILES_ACTIVE (local)
  - Purpose: Run the backend using `dev` profile locally.
  - Example: `dev`

- VITE_API_BASE_URL (local frontend dev)
  - Purpose: Point SPA to a local backend during development.
  - Example: `http://localhost:8080`

- Any other dev-only environment variables may be set in your local environment or `.env` files; avoid committing secrets.

---

Changing names or adding variables
- If you rename or add secrets/vars, update this file and `README_CLOUD.md` / `infra/DEPLOY.md` and any CI workflow references so operators and CI remain consistent.

Security reminder
- Do not commit secrets into the repository. Use Key Vault and GitHub repository secrets, and prefer OIDC-based federated credentials where possible.

---

Quick steps: set Key Vault URL secret for GitHub Actions

- Key Vault name: `slowfall-keyvault-next`
- Key Vault URL: `https://slowfall-keyvault-next.vault.azure.net/`

Set repository secrets (recommended):

- Required secret name (used by workflows): `APP_SECURITY_AZURE_KEYVAULT_VAULT_URL`
- Convenience alias for scripts: `AZ_KEYVAULT_VAULT_URL` (optional duplicate)

If you have the GitHub CLI (`gh`) and are authenticated, run these commands from the repository root (or add `--repo owner/repo` to target a specific repo):

```bash
gh secret set APP_SECURITY_AZURE_KEYVAULT_VAULT_URL --body "https://slowfall-keyvault-next.vault.azure.net/" --visibility=private
gh secret set AZ_KEYVAULT_VAULT_URL --body "https://slowfall-keyvault-next.vault.azure.net/" --visibility=private
```

Or use the GitHub web UI:
- Repo → Settings → Secrets and variables → Actions → New repository secret
  - Name: `APP_SECURITY_AZURE_KEYVAULT_VAULT_URL`
  - Value: `https://slowfall-keyvault-next.vault.azure.net/`
- Repeat for `AZ_KEYVAULT_VAULT_URL` if desired.

Remember to also set the corresponding App Service runtime app setting for the backend (so the running app can access Key Vault):

```
az webapp config appsettings set \
  --resource-group "<AZ_RESOURCE_GROUP>" \
  --name "<AZ_WEBAPP_BACKEND>" \
  --settings APP_SECURITY_AZURE_KEYVAULT_VAULT_URL="https://slowfall-keyvault-next.vault.azure.net/"
```

Security reminder: Do not commit secret values into the repository. Use GitHub repository secrets and Azure Key Vault. If you want me to set the repository secrets now, I can run the `gh secret set` commands for you — I need either a configured git remote that points to the GitHub repo or the `owner/repo` string, and your confirmation to proceed.

---

Azure Key Vault: required properties and permissions

- Required runtime env / Spring properties (set as App Service app settings or CI secrets):
  - APP_SECURITY_AZURE_KEYVAULT_VAULT_URL (Spring property: app.security.azure.keyvault.vault-url)
    - Example: `https://slowfall-keyvault-next.vault.azure.net/`
  - APP_SECURITY_AZURE_KEYVAULT_KEY_NAME (Spring property: app.security.azure.keyvault.key-name)
    - Example: `slowfall-sign-key`
  - (Optional) APP_SECURITY_AZURE_KEYVAULT_SECRET_NAME (Spring property: app.security.azure.keyvault.secret-name)
    - Used when storing a PEM private key as a Key Vault secret instead of a Key Vault Key.

- Required Key Vault permissions for the application identity (Managed Identity or Service Principal):
  - Keys: `get`, `sign` (needed when using Key Vault Keys for JWT signing or crypto operations)
  - Secrets: `get` (needed when using Key Vault Secrets to store PEM keys or credentials)

- Troubleshooting tips if the application fails on startup with a Key Vault-related NPE or IllegalStateException:
  1. Verify the vault URL is correct and accessible from the App Service (check `APP_SECURITY_AZURE_KEYVAULT_VAULT_URL`).
  2. Confirm the configured key name (`APP_SECURITY_AZURE_KEYVAULT_KEY_NAME`) matches the name in the Key Vault `Keys` blade (watch for typos and case-sensitivity).
  3. In the Key Vault portal, verify the key is enabled and has a valid key identifier (a `kid`) and that the key has a JWK payload (RSA key). Soft-deleted or placeholder keys may not include JWK material.
  4. Ensure the app's managed identity or service principal has the `keys/get` and `keys/sign` permissions (or assign the built-in role `Key Vault Crypto User` / `Key Vault Crypto Service Encryption User` as appropriate). For secrets access, grant `secrets/get`.
  5. If using RBAC rather than legacy access policies, grant the matching Key Vault roles at the correct scope.
  6. Temporarily set `APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST=false` (if present) to allow the app to start while you fix RBAC; prefer to fix permissions and revert this change.

- Where to update docs if you add or rename these env vars:
  - Update `README_ENV.md` (this file), and `infra/DEPLOY.md` / `README_CLOUD.md` so CI and deploy scripts reflect the new variable names and values.

---

