# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /work

# Cache Gradle wrapper and build files for faster rebuilds
COPY gradlew .
COPY gradle gradle
# Allow settings.gradle or settings.gradle.kts
COPY settings.gradle* build.gradle* ./

# Make wrapper executable
RUN chmod +x ./gradlew

# Copy source
COPY . .

# Re-ensure wrapper executable
RUN chmod +x ./gradlew

# Build fat jar (skip tests for speed)
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: runtime image
FROM eclipse-temurin:21-jre AS runtime

# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app

# Copy jar from builder and set ownership
COPY --from=builder --chown=app:app /work/build/libs/*.jar app.jar

# JVM options (override via JAVA_OPTS)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8080
# Build-arg to set SPRING profile (default: prod)
ARG SPRING_PROFILES_ACTIVE=prod
ENV SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE}
EXPOSE 8080

# Install minimal tools for healthcheck/debug
RUN apt-get update && apt-get install -y --no-install-recommends curl coreutils && rm -rf /var/lib/apt/lists/*

# Entrypoint: diagnostics, validation, then run the jar
RUN cat > /usr/local/bin/entrypoint.sh <<'SH'
#!/bin/sh
set -e

CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

# Timestamped startup marker
echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID} time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# --- Diagnostics: small, non-secret set ---
echo "--- Startup diagnostics ---"
echo "SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-<not-set>}"
echo "PORT=${PORT:-<not-set>}"
echo "JAVA_OPTS=${JAVA_OPTS:-<not-set>}"

# Validate jar exists
if [ ! -f /app/app.jar ]; then
  echo "ERROR: expected /app/app.jar not found in container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
  ls -la /app || true
  exit 1
fi

# Small /app snapshot
ls -la /app || true

# Show Java version info
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

# Finally exec the java process
exec java $JAVA_OPTS -jar /app/app.jar
SH

RUN chmod +x /usr/local/bin/entrypoint.sh

# Run as non-root user
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Start app
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
