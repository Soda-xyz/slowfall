# Cloud Deployment & Key Vault (README_CLOUD.md)

This file is the canonical deployment playbook for operators and CI/CD engineers. It consolidates Azure, Key Vault, and
GitHub Actions guidance for the current desired architecture: Entra (Azure AD) authentication, an nginx reverse proxy
hosted in its own App Service container, and container images published to GHCR.

Important references

- Azure Entra ID (Azure AD) docs: https://learn.microsoft.com/azure/active-directory/
- Azure Key Vault Keys overview: https://learn.microsoft.com/azure/key-vault/keys/about-keys
- App Service containers with GitHub Actions: https://learn.microsoft.com/azure/app-service/deploy-containers?tabs=github-actions

Overview (current architecture)

- Entra (Azure AD) is the identity provider (OIDC) for frontend and backend in production. Do not enable HTTP Basic in production.
- Run a dedicated nginx reverse proxy as an App Service container (`slowfall-proxy`) to handle TLS termination (if needed),
  header forwarding, cookie preservation, and CORS handling for the frontend.
- Use GHCR for container images. The CI pipeline in `.github/workflows/ci-cd.yml` builds and pushes images to GHCR and then
  deploys App Service containers using the published images.

What changed (historical cleanup)

- Front Door resources and rulesets were removed from the architecture and should no longer be referenced in IaC or
  deployment scripts. Remove any Front Door artifacts from Bicep/ARM templates if present.
- ACR references were removed in favor of GHCR. Remove ACR-related parameters from CI/infra and update documentation.
- Any scripts that enable HTTP Basic authentication in production were removed or disabled; Basic auth remains available only
  in development-like profiles (dev/pseudo).

Key resources to provision (high level)

1. Resource Group (new) — e.g., `slowfall-appservice-prod`
2. App Service Plan (Linux) — example name `slowfall-plan` (SKU B1, Basic)
3. App Service (container) — `slowfall-frontend`
4. App Service (container) — `slowfall-backend`
5. App Service (container) — `slowfall-proxy` (nginx)
6. Azure Key Vault — `slowfall-keyvault-next` (store keys, certs, secrets)
7. Entra App Registrations — frontend SPA client and backend API

Role & access guidance (Key Vault + Entra)

- Key Vault RBAC (preferred): assign roles scoped to the Key Vault resource rather than using vault access policies.
  - Backend (system-assigned identity) → `Key Vault Secrets User` and `Key Vault Crypto User` (if backend performs key ops).
  - Proxy (system-assigned identity) → `Key Vault Secrets User` only (read certs/secrets); do not grant Crypto unless proxy
    performs signing or key operations.
- Entra App Registrations: create a SPA/client registration for the frontend (public client) and a confidential client for
  the backend if the backend needs to call Graph or other APIs. CI can create/update these registrations via `az`/Graph.

App Service and container recommendations

- App Service Plan: use Linux and an appropriate SKU (B1 or size suitable for your traffic). Configure App Services with `Always On` enabled.
- Container images: use GHCR URIs published by the CI workflow.

Proxy & deployment notes

- The nginx reverse proxy runs as a dedicated App Service container named `slowfall-proxy` by convention. Configure its
  app settings with `WEBSITES_PORT=80`, `BACKEND_HOST=<your-backend-fqdn>` (for example `slowfall-backend.azurewebsites.net`),
  and `BACKEND_PORT=8080`. The proxy image reads these values via environment variable substitution at container start.

High-level deployment flow (CLI-first, CI-driven)

1. Set subscription and create a new resource group.
2. Create App Service Plan (Linux, appropriate SKU).
3. Create App Services (frontend, backend, proxy) as Linux container apps and configure `Always On`.
4. Assign system-managed identities to the backend (and proxy if needed).
5. Create Key Vault and create keys/secrets (or use an existing vault). Grant RBAC role assignments to the managed identities
   for `Key Vault Secrets User` (and `Key Vault Crypto User` for backend if needed).
6. Configure App Service app settings and Key Vault references (if using Key Vault references).
7. Deploy container images from GHCR to the App Services and verify the apps are running.
8. Validate OIDC authentication, health endpoints, and end-to-end flows.

Example CLI snippets (single-line copies; adapt names)

```bash
az account set --subscription <subscription-id>
az group create --name slowfall-appservice-prod --location westeurope
az appservice plan create --name slowfall-plan --resource-group slowfall-appservice-prod --is-linux --sku B1
az webapp create --resource-group slowfall-appservice-prod --plan slowfall-plan --name slowfall-proxy --deployment-container-image-name ghcr.io/Soda-xyz/slowfall-proxy:latest
az webapp identity assign --resource-group slowfall-appservice-prod --name slowfall-backend
az role assignment create --assignee <backend-principalId> --role 4633458b-17de-408a-b874-0445c86b69e6 --scope /subscriptions/<sub>/resourceGroups/slowfall-appservice-prod/providers/Microsoft.KeyVault/vaults/slowfall-keyvault-next
```

CI/CD notes (GitHub Actions)

- CI uses OIDC-based federated credentials for az login when configured; avoid storing long-lived client secrets in the repo.
- The workflow `.github/workflows/ci-cd.yml` performs the following high-level tasks:
  - Build & test backend (Gradle)
  - Install & test frontend (Node + Vite)
  - Build frontend assets and run a sanity check to ensure `VITE_API_BASE_URL` did not cause duplicated `/api/api` paths
  - Build and test the frontend image locally (CI job)
  - Build & push images to GHCR (main branch only)
  - Deploy images to App Services using Azure CLI (main branch only)

## CI-driven runtime configuration for AAD group membership

The CI workflow will propagate a GitHub Actions secret named `SLOWFALL_WEB_USERS_GROUP_ID` into the backend App Service as the app setting `APP_SECURITY_ALLOWED_GROUP_ID` during deploy. This allows changing the allowed AAD group via a single secret rotation and a CI redeploy instead of manually editing App Service settings.

How to use:
- Create a repository secret named `SLOWFALL_WEB_USERS_GROUP_ID` with the AAD group GUID value (e.g. `1dea5e51-d15e-4081-9722-46da3bfdee79`).
- The CI workflow will set `APP_SECURITY_ALLOWED_GROUP_ID` on the `slowfall-backend` App Service during the `publish-images` job (the workflow uses `az webapp config appsettings set`).
- The backend Spring Boot app reads the runtime value via the property `app.security.allowed-group-id`.

Operational note:
- To change the allowed group, update the GitHub secret and run the deploy workflow; CI will update the App Service setting automatically.

Health checks, monitoring, and failure modes

- Ensure an unauthenticated health endpoint (e.g., `/actuator/health`) is available for App Service probes.
- If Key Vault connectivity is required, use `APP_SECURITY_AZURE_KEYVAULT_FAIL_FAST=true` during CI validation to detect
  misconfigurations early.

Troubleshooting (concise)

- Role/permission issues: check Key Vault's Access control (IAM) and the role assignments list.
- Entra issues: confirm app registration redirect URIs, client IDs, and API scope settings.

Useful docs

- Azure App Service for Containers: https://learn.microsoft.com/azure/app-service/quickstart-docker
- Entra ID OIDC guidance: https://learn.microsoft.com/azure/active-directory/develop/v2-protocols-oidc
- Azure Key Vault: https://learn.microsoft.com/azure/key-vault/
