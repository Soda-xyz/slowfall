# slowfall — README

This repository contains the slowfall backend and frontend. Below are concise notes for developers and pointers to
environment and deployment documentation.

## Overview

slowfall is a Java Spring Boot backend with a TypeScript/React frontend. This README contains developer-facing
information (logging, the AOP logging aspect, and repository pointers). See `README_ENV.md` for environment variables
and `README_CLOUD.md` for cloud deployment and IaC guidance.

Proxy (current architecture)

- Reverse proxy: A dedicated nginx reverse proxy (`slowfall-proxy`) runs as its own App Service container in the
  recommended architecture. The proxy is responsible for TLS termination (if used), header forwarding, cookie preservation,
  and mapping `/api/` requests to the backend host. The proxy reads `BACKEND_HOST` and related settings from App Service
  app settings.

Notes about CI / builds / Docker (current)

- CI uses GitHub Actions with OIDC-based login to Azure (`azure/login` + `enable-oidc: true`) — no long-lived client secrets in CI.
- Images are built in CI and pushed to Azure Container Registry (ACR) using the canonical secret `ACR_NAME` (images: `<ACR_NAME>.azurecr.io/...`).
- CI produces production-mode artifacts only: backend builds with `SPRING_PROFILES_ACTIVE=prod` and frontend builds with Vite `--mode production` (VITE_FRONTEND_ENV=production). The Docker builds bake these values via build-args.
- Keep a repo-root `.dockerignore` (present) so large or sensitive files (node_modules, frontend/dist, .env*) are excluded from the Docker build context. The repo also keeps `frontend/.gitignore` for local dev convenience.
- Frontend `.env.*` behavior: `.env.development` is useful for local dev; production values are baked at build-time via CI build-args (empty `VITE_API_BASE_URL` in CI means the SPA uses relative `/api` paths).

See `README_ENV.md` and `README_CLOUD.md` for environment, secret, and deployment instructions.

Note: `README_ENV.md` documents CI secrets used by the workflow (for example `DEPLOY_ENV`, `PSEUDO_AUTH_ENABLED`, `PSEUDO_USER`, `PSEUDO_PASS`) and the frontend build-mode propagation used by the Docker build step.
