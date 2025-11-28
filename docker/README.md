This folder contains Docker artifacts for the slowfall project.

Files:

- backend/Dockerfile - multi-stage Dockerfile that builds the Spring Boot jar using the Gradle wrapper (Java 21) and
  produces a slim runtime image.
- frontend/Dockerfile - multi-stage Dockerfile that builds the Vite React app and serves it with nginx (production).
- frontend/nginx.conf - nginx config for SPA history API fallback and cache headers.
- docker-compose.yml — development compose that builds and runs backend and frontend services (repo root used as build
  context).
- docker-compose.prod.yml - production-oriented compose file that builds and runs frontend + backend images.

Quick local commands (from the repository root):

- Images are built automatically by the compose command below; manual image builds are rarely necessary.

- Start development services (builds both backend and frontend):

  ```powershell
  docker compose -f docker/docker-compose.yml up --build -d
  ```

- Stop and remove volumes:

  ```powershell
  docker compose -f docker/docker-compose.yml down --volumes
  ```

Notes:

- Both `docker/docker-compose.yml` (dev) and `docker/docker-compose.prod.yml` (prod) now build frontend and backend from
  the canonical Dockerfiles under `docker/` using the repository root as the build context. This keeps builds consistent
  between local dev and production flows.
- If you prefer building the frontend image from the `frontend/` directory explicitly, use the
  `docker/frontend/Dockerfile` with repo root context as shown above.

CI/CD:

- See the repository root README for CI/CD workflow and image-publishing details (this avoids duplicating CI notes
  here).

Health & verification:

- Backend actuator health: http://localhost:8080/actuator/health
- Frontend served at: http://localhost/

Developer tips:

- If you want Postgres included for production parity or a developer override that mounts caches and enables remote JVM
  debugging, request a `docker-compose.override.yml` and I will add a small example.

- Advanced: you can also enable remote JVM debugging temporarily by setting `JAVA_TOOL_OPTIONS` when running the backend
  image
  (see `docker/docker-compose.yml` for a sample command).
