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
EXPOSE 8080

# Install curl for HEALTHCHECK and base64 if missing
RUN apt-get update && apt-get install -y --no-install-recommends curl coreutils && rm -rf /var/lib/apt/lists/*

# Create the container entrypoint which will decode an APP_SECURITY_JKS_BASE64 env var
RUN cat > /usr/local/bin/entrypoint.sh <<'SH'
#!/bin/sh
set -e

# default keystore path if not provided
: "${APP_SECURITY_JKS_PATH:=/etc/slowfall/keystore.jks}"

if [ -n "$APP_SECURITY_JKS_BASE64" ]; then
  echo "[entrypoint] Decoding APP_SECURITY_JKS_BASE64 to $APP_SECURITY_JKS_PATH"
  mkdir -p "$(dirname "$APP_SECURITY_JKS_PATH")"
  # decode base64 payload into keystore file
  printf '%s' "$APP_SECURITY_JKS_BASE64" | base64 -d > "$APP_SECURITY_JKS_PATH"
  chmod 400 "$APP_SECURITY_JKS_PATH" || true
fi

# If APP_SECURITY_JKS_URI is set, attempt to fetch it using curl (useful for simple HTTP sources)
# Note: For production Key Vault, prefer Key Vault references or SDK-based fetch with Managed Identity.
if [ -n "$APP_SECURITY_JKS_URI" ] && [ ! -f "$APP_SECURITY_JKS_PATH" ]; then
  echo "[entrypoint] Fetching keystore from APP_SECURITY_JKS_URI"
  mkdir -p "$(dirname "$APP_SECURITY_JKS_PATH")"
  curl -fsSL "$APP_SECURITY_JKS_URI" -o "$APP_SECURITY_JKS_PATH"
  chmod 400 "$APP_SECURITY_JKS_PATH" || true
fi

# Finally exec the java process
exec java $JAVA_OPTS -jar /app/app.jar
SH

RUN chmod +x /usr/local/bin/entrypoint.sh

# Run as non-root user
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Use the custom entrypoint that decodes keystore if present
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
