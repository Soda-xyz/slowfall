# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /work

# Copy Gradle wrapper and build files first to leverage layer caching
COPY gradlew .
COPY gradle gradle
# COPY settings.gradle settings.gradle.kts build.gradle* ./
# Allow either settings.gradle or settings.gradle.kts; use wildcard so COPY doesn't fail when one isn't present
COPY settings.gradle* build.gradle* ./

# Ensure wrapper is executable
RUN chmod +x ./gradlew

# Copy the rest of the source
COPY . .

# Ensure the wrapper is executable after the full copy (COPY . . can overwrite permissions)
RUN chmod +x ./gradlew

# Build the application jar (skip tests for faster local builds)
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: runtime image
FROM eclipse-temurin:21-jre AS runtime

# create a non-root user
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app

# Copy the Spring Boot fat jar from the builder stage and set ownership to app user
COPY --from=builder --chown=app:app /work/build/libs/*.jar app.jar

# JVM options (override at runtime with JAVA_OPTS env var)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8080
# Allow bake-in of SPRING_PROFILES_ACTIVE during image build via build-arg. CI should pass
# SPRING_PROFILES_ACTIVE=prod when building production images. This ENV acts as a default and
# can still be overridden via Azure App Service app settings or container runtime env.
ARG SPRING_PROFILES_ACTIVE=prod
ENV SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE}
EXPOSE 8080

# Install curl for HEALTHCHECK and base64 if missing
RUN apt-get update && apt-get install -y --no-install-recommends curl coreutils && rm -rf /var/lib/apt/lists/*

# Create the container entrypoint which defers to the application for Key Vault integration
RUN cat > /usr/local/bin/entrypoint.sh <<'SH'
#!/bin/sh
set -e

CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

# Timestamped startup marker
echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID} time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# --- Diagnostics: print a small set of non-secret envs to aid debugging ---
echo "--- Startup diagnostics ---"
echo "SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-<not-set>}"
echo "PORT=${PORT:-<not-set>}"
echo "JAVA_OPTS=${JAVA_OPTS:-<not-set>}"
# Use AZ_KEYVAULT_VAULT_URL as the canonical external env name (this is what Azure/CI sets)
echo "AZ_KEYVAULT_VAULT_URL=${AZ_KEYVAULT_VAULT_URL:-<not-set>}"

# --- Map presence of canonical Key Vault env (do NOT create any duplicate env names) ---
# Use AZ_KEYVAULT_VAULT_URL as the canonical external env name and do not duplicate it into
# another env variable to avoid confusion. The application should be configured to read
# the Spring property app.security.azure.keyvault.vault-url from the AZ_KEYVAULT_VAULT_URL env
# provided by CI/App Service.
if [ -n "${AZ_KEYVAULT_VAULT_URL}" ]; then
  echo "AZ_KEYVAULT_VAULT_URL is present"
else
  echo "AZ_KEYVAULT_VAULT_URL not set; ensure the application property 'app.security.azure.keyvault.vault-url' is provided via your deployment environment"
fi

# Enforce single canonical env name for Key Vault key name: AZ_KEYVAULT_KEY_NAME
# We intentionally do NOT map alternate App Service or legacy secret names. Use exactly
# `AZ_KEYVAULT_KEY_NAME` as the repository secret and App Service app setting.
if [ -n "${AZ_KEYVAULT_KEY_NAME}" ]; then
  echo "AZ_KEYVAULT_KEY_NAME is present"
else
  echo "AZ_KEYVAULT_KEY_NAME not set; ensure the deployment provides AZ_KEYVAULT_KEY_NAME as the Key Vault Key name (Spring property: app.security.azure.keyvault.key-name)"
fi

echo "AZ_KEYVAULT_VAULT_URL=${AZ_KEYVAULT_VAULT_URL:-<not-set>}"
echo "AZ_KEYVAULT_KEY_NAME=${AZ_KEYVAULT_KEY_NAME:-<not-set>}"

# Validate the jar exists and is readable
if [ ! -f /app/app.jar ]; then
  echo "ERROR: expected /app/app.jar not found in container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
  ls -la /app || true
  exit 1
fi

# Show tiny filesystem /app snapshot to help debugging
ls -la /app || true

# Show Java version info (helps diagnose JVM incompatibilities)
if command -v java >/dev/null 2>&1; then
  echo "--- Java version ---"
  java -version 2>&1 || true
else
  echo "Java not found in PATH"
fi

# Quick connectivity check to Key Vault URL (will usually return 401/403 without auth)
if [ -n "${AZ_KEYVAULT_VAULT_URL}" ]; then
  echo "Testing connectivity to Key Vault: ${AZ_KEYVAULT_VAULT_URL} (this only verifies network/DNS/TLS, not auth)"
  if command -v curl >/dev/null 2>&1; then
    # Use a fast HEAD-style request; Key Vault may redirect, so use -I to fetch headers and capture HTTP code
    HTTP_CODE=$(curl -I -sS -o /dev/null -w '%{http_code}' --max-time 10 "${AZ_KEYVAULT_VAULT_URL}" || echo "000")
    echo "Key Vault HTTP response code: ${HTTP_CODE}"
    # If 000 then curl failed (network/DNS). If 401/403 it's reachable but auth required (expected for secured vaults).
  else
    echo "curl not available to test Key Vault connectivity"
  fi
else
  echo "AZ_KEYVAULT_VAULT_URL not set; skipping Key Vault connectivity test"
fi

# Optionally run `java -jar --help` to ensure Java can execute the jar (fast check)
if ! java -jar /app/app.jar --help >/dev/null 2>&1; then
  echo "WARNING: quick java -jar check failed; proceeding to exec java to show full error logs"
fi

# Finally exec the java process (stdout/stderr will stream to container logs)
exec java $JAVA_OPTS -jar /app/app.jar
SH

RUN chmod +x /usr/local/bin/entrypoint.sh


# Run as non-root user
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Use the custom entrypoint that starts the application
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
