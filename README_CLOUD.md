# Cloud Deployment & Key Vault (README_CLOUD.md)

This file is the canonical deployment playbook for operators and CI/CD engineers. It consolidates Azure, Key Vault, and
GitHub Actions guidance.

Important references

- Azure Key Vault Keys overview: https://learn.microsoft.com/azure/key-vault/keys/about-keys
- Azure Key Vault access
  policies: https://learn.microsoft.com/azure/key-vault/general/assign-access-policy?tabs=azure-cli
- Azure Key Vault RBAC: https://learn.microsoft.com/azure/key-vault/general/rbac-guide
- App Service containers with GitHub
  Actions: https://learn.microsoft.com/azure/app-service/deploy-containers?tabs=github-actions
- GHCR
  guide: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry

Overview

The recommended deployment approach uses two containerized Web Apps (frontend and backend) running in Azure App Service.
Secrets and signing keys are stored in Azure Key Vault. CI/CD is handled by GitHub Actions which builds images, pushes
them to a container registry (GHCR or ACR), and updates the App Service container configuration.

## Table of contents

- [Prerequisites](#prerequisites)
- [Azure resources & recommended setup](#azure-resources--recommended-setup)
- [Azure CLI (PowerShell) example](#azure-cli-powershell-example)
- [GitHub Actions recommended flow](#github-actions-recommended-flow)
- [Viewing your GHCR images](#viewing-your-ghcr-images)
- [Key Vault & JWKS](#key-vault--jwks)
- [Health checks & fail-fast](#health-checks--fail-fast)
- [Setting ALLOWED_ORIGINS in App Service](#setting-allowed_origins-in-app-service)
- [Troubleshooting checklist](#troubleshooting-checklist)
- [Optional: Example GitHub Actions workflow](#optional-example-github-actions-workflow)

Prerequisites

- Azure subscription
- Resource Group for the app
- Container registry (GHCR or ACR)
- Azure Key Vault with a signing key (Key resource) and appropriate permissions
- GitHub repository with Actions enabled and secrets configured (or use Managed Identity)

Azure resources & recommended setup

1. Create a Resource Group and App Service Plan for Linux containers.
2. Create two App Services (Linux, container): `slowfall-frontend` and `slowfall-backend`.
3. Create an Azure Key Vault and an RSA Key (e.g., `slowfall-sign-key`). Use a Key resource (not a secret) so signing
   can happen inside Key Vault.
4. Enable a system-assigned Managed Identity on the backend App Service and grant it `get` and `sign` permissions on the
   Key Vault Key (or use RBAC).

Azure CLI (PowerShell) example

```powershell
# variables - replace values
$rg = "slowfall-rg"
$location = "westeurope"
$vaultName = "slowfall-kv"
$keyName = "slowfall-sign-key"
$planName = "slowfall-plan"
$frontendApp = "slowfall-frontend"
$backendApp = "slowfall-backend"

# create resource group
az group create --name $rg --location $location

# create key vault
az keyvault create --name $vaultName --resource-group $rg --location $location

# create an RSA key in Key Vault
az keyvault key create --vault-name $vaultName --name $keyName --kty RSA

# create an app service plan for Linux containers
az appservice plan create --name $planName --resource-group $rg --is-linux --sku B1

# create web apps (Linux) - container-based
az webapp create --resource-group $rg --plan $planName --name $frontendApp --deployment-container-image-name <frontend-image>
az webapp create --resource-group $rg --plan $planName --name $backendApp --deployment-container-image-name <backend-image>

# enable system-assigned managed identity for backend
az webapp identity assign --resource-group $rg --name $backendApp

# get principal id of backend
$principalId = (az webapp show --name $backendApp --resource-group $rg --query identity.principalId -o tsv)

# grant Key Vault key permissions to the managed identity (using access policy)
az keyvault set-policy --name $vaultName --resource-group $rg --object-id $principalId --key-permissions get sign list
```

Notes & options

- RBAC vs Access policies: You may prefer Key Vault RBAC for larger organizations. See the Azure RBAC guide.
- If you cannot use a Managed Identity, create a service principal and store its client secret in GitHub Secrets (
  AZURE_CLIENT_* variables) and use those in CI.

GitHub Actions recommended flow

- Build backend and frontend images
- Push images to GHCR or ACR
- Update App Service container settings with new image tags
- Restart the apps (or let App Service auto-deploy on tag update)

# Example GitHub Actions environment variables (set via secrets). This repository uses OIDC-based federated credentials

# for Azure deployments (no client secret stored in repository secrets). Configure OIDC in the Azure service principal

# and provide the following secrets in the repository (used as identifiers rather than secrets):

```yaml
env:
  AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  REGISTRY_USERNAME: ${{ github.actor }}
  REGISTRY_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  SPRING_PROFILES_ACTIVE: prod
```

## Viewing your GHCR images

After the CI/CD pipeline pushes images to GHCR (GitHub Container Registry), you can view them in several ways:

**Via GitHub UI:**

1. Navigate to your repository on GitHub
2. Click on the **Packages** link in the right sidebar (under "Releases")
3. Alternatively, go directly to `https://github.com/<owner>/<repo>/pkgs/container/<image-name>`

For this repository, the published images are:

- Backend: `https://github.com/orgs/<owner>/packages/container/slowfall-backend`
- Frontend: `https://github.com/orgs/<owner>/packages/container/slowfall-frontend`

**Via Docker CLI:**

```bash
# List available tags for an image
docker manifest inspect ghcr.io/<owner>/slowfall-backend:latest

# Pull and inspect an image locally
docker pull ghcr.io/<owner>/slowfall-backend:latest
docker image inspect ghcr.io/<owner>/slowfall-backend:latest
```

**Via GitHub CLI (gh):**

```bash
# List packages in a repository
gh api /user/packages?package_type=container

# List versions/tags for a specific package
gh api /users/<owner>/packages/container/slowfall-backend/versions
```

**Notes:**

- Replace `<owner>` with the GitHub username or organization name (e.g., `soda-xyz`)
- Images are tagged with both `latest` and the commit SHA (e.g., `ghcr.io/<owner>/slowfall-backend:abc123`)
- Package visibility follows repository visibility; ensure the repository is public or you have appropriate access
- See the [GHCR documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) for more details

Key Vault & JWKS

- Use a Key Vault Key for signing and grant the app identity `sign` permission.
- The app will expose a JWKS endpoint at `GET /.well-known/jwks.json` containing the public key(s) so consumers can
  validate JWTs without Key Vault access.
- When rotating keys, add the new key to Key Vault and ensure your JWKS includes both old and new public keys during the
  transition.

Health checks & fail-fast

- `app.security.azure.keyvault.fail-fast=true` will make the app fail to start if Key Vault access is not available;
  recommended in CI.
- If `fail-fast=false` the app will start in degraded mode and the Key Vault health indicator will report DOWN at
  `/actuator/health`.

Setting ALLOWED_ORIGINS in App Service

- Portal: App Service -> Settings -> Configuration -> Application settings -> Add `ALLOWED_ORIGINS` with the
  comma-separated origins.
- CLI (example):

```powershell
az webapp config appsettings set --resource-group <rg> --name <backend-app-name> --settings "ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com"
az webapp restart --resource-group <rg> --name <backend-app-name>
```

Troubleshooting checklist

- `az keyvault show --name <vault>` to confirm vault exists.
- `az keyvault key show --vault-name <vault> --name <key>` to confirm key exists.
- Check Key Vault access policy or RBAC for `get` and `sign` on Keys.
- Inspect `/actuator/health` for Key Vault health indicator details.

Optional: Example GitHub Actions workflow

If you'd like, I can add a sample workflow that:

1. Builds and pushes backend image to GHCR.
2. Builds and pushes frontend image.
3. Uses Azure CLI to set App Service container image settings and restarts the apps.
