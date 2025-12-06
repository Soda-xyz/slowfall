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

# Quick runtime check: verify Java executable works (do not execute the jar)
if command -v java >/dev/null 2>&1; then
  echo "Java available; version:"
  java -version 2>&1 || true
else
  echo "Java not found in PATH"
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
