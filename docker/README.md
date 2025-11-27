This folder contains Docker artifacts for the slowfall project.

Files:

- backend/Dockerfile - multi-stage Dockerfile that builds the Spring Boot jar using the Gradle wrapper (Java 21) and
  produces a slim runtime image.
- frontend/Dockerfile - multi-stage Dockerfile that builds the Vite React app and serves it with nginx (production).
- frontend/nginx.conf - nginx config for SPA history API fallback and cache headers.
- docker-compose.yml—simple CLI-friendly compose for local development / testing (builds & runs backend only).
- docker-compose.prod.yml - production-oriented compose file that builds and runs frontend + backend images.

Quick local commands (from the repository root):

Build backend image (production tag):

```powershell
docker build -t slowfall-backend:prod -f docker\backend\Dockerfile .
```

Build frontend image (production tag):

```powershell
docker build -t slowfall-frontend:prod -f docker\frontend\Dockerfile .
```

Run production composes (builds images and runs):

```powershell
docker compose -f docker\docker-compose.prod.yml up --build -d
```

Tear down:

```powershell
docker compose -f docker\docker-compose.prod.yml down --volumes
```

CI/CD notes:

- The provided GitHub Actions workflow (.GitHub/workflows/ci-build.yml) builds the backend jar, builds the frontend, then
  builds and pushes images to GitHub Container Registry (GHCR). It tags images with the commit SHA.
- Ensure the repository has package write permissions so the action can push to GHCR. The action uses the repo's
  GITHUB_TOKEN for authentication.

Health & verification:

- Backend actuator health: http://localhost:8080/actuator/health
- Frontend served at: http://localhost/

If you want Postgres included for production parity or a dev override file that mounts caches and enables the remote
debugger, request `docker-compose.override.yml` and I will add it.

