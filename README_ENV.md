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

Note: Do NOT store raw secret values in the repository. Store secret names, appIds, and Key Vault URIs here as a reference; actual secret values should be kept in Key Vault or GitHub Actions secrets.

---

GitHub Actions / Repository secrets (set in GitHub → Settings → Secrets → Actions)
- DEPLOY_ENV (required)
  - Purpose: Controls publish/deploy mode used by CI (e.g., `prod`/`production` → production behavior; `dev`/`development` → dev behavior).
  - Example: `prod`
  - Notes: The `publish-images` job fails early if this secret is not set.

- AZURE_SUBSCRIPTION_ID (required for Azure deploy steps)
  - Purpose: Subscription used by `az` commands in deploy jobs.
  - Example: `1e13e8d8-c624-405f-89c7-5f0e5f965399`

- AZURE_TENANT_ID (required for Azure deploy steps)
  - Purpose: Azure tenant id for OIDC or az login.
  - Example: `f3715782-d0db-4347-bd92-2800c9d5e645`

- AZURE_CLIENT_ID (required for Azure OIDC / federated login)
  - Purpose: Client id of the service principal used by `azure/login` (expect a federated credential configured for this id).
  - Example: `f17c9149-9c99-4294-ada3-9a97f0cf7b0b`

- AZURE_RG (required)
  - Purpose: Resource group used by deploy scripts (e.g., where App Services live).
  - Example: `slowfall-appservice-prod`

- BACKEND_APP_NAME (required)
  - Purpose: Backend App Service name (used by CI to resolve FQDN and to set images/app settings).
  - Example: `slowfall-backend`

- FRONTEND_APP_NAME (required)
  - Purpose: Frontend App Service name (used by CI to set images/app settings).
  - Example: `slowfall-frontend`

- PROXY_APP_NAME (optional)
  - Purpose: Proxy App Service name (defaults to `slowfall-proxy` when not set in CI/deploy).
  - Example: `slowfall-proxy`

- ALLOWED_ORIGINS (optional)
  - Purpose: Comma-separated allowed CORS origins that CI will configure on App Services if provided.
  - Example: `https://slowfall-frontend.azurewebsites.net`

- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL (optional)
  - Purpose: Key Vault URI used by CI or the proxy as a fallback; prefer storing Key Vault URI in repository secrets if CI must know it.
  - Example: `https://slowfall-keyvault-next.vault.azure.net/`

- GHCR_TOKEN (optional)
  - Purpose: Personal access token for pushing to GHCR if your org disallows using the default `GITHUB_TOKEN` for package pushes.

---

App Service — Runtime App Settings (set in Azure Portal / App Service -> Configuration -> Application settings)

Backend App Service (runtime)
- SPRING_PROFILES_ACTIVE
  - Purpose: Spring profile for backend runtime (e.g., `prod`, `dev`). CI sets this during deploy when `DEPLOY_ENV` is present.
  - Example: `prod`

- ALLOWED_ORIGINS
  - Purpose: Comma-separated list used by the backend for CORS (maps to `app.cors.allowed-origins`).
  - Example: `https://slowfall-frontend.azurewebsites.net`

- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL (optional)
  - Purpose: Key Vault URI used by backend at runtime if reading secrets directly from Key Vault is required.
  - Example: `https://slowfall-keyvault-next.vault.azure.net/`

Frontend App Service (runtime)
- ALLOWED_ORIGINS
  - Purpose: Same as backend; set here only if you want the frontend App Service to be aware of allowed origins via app settings.

Proxy App Service (`slowfall-proxy`) — runtime settings
- WEBSITES_PORT
  - Purpose: Port Nginx listens on in the container.
  - Example: `80`

- BACKEND_HOST
  - Purpose: Backend FQDN used by the proxy for routing (e.g., `slowfall-backend.azurewebsites.net`). CI resolves this from `BACKEND_APP_NAME`.
  - Example: `slowfall-backend.azurewebsites.net`

- BACKEND_PORT
  - Purpose: Backend container port.
  - Example: `8080`

- CLIENT_MAX_BODY_SIZE (optional)
  - Purpose: Nginx proxy client_max_body_size setting.
  - Example: `20m`

- PROXY_READ_TIMEOUT / PROXY_SEND_TIMEOUT (optional)
  - Purpose: Proxy timeout tuning.
  - Example: `90s`

- APP_SECURITY_AZURE_KEYVAULT_VAULT_URL (optional)
  - Purpose: If the proxy reads certs/secrets from Key Vault via a managed identity.

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
