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

# In the new deployment model TLS is terminated at Azure Front Door and
# Key Vault is the single source of truth for certificates/keys. The
# application is responsible for accessing Key Vault via Managed Identity
# or DefaultAzureCredential. No local keystore is written by the entrypoint.

echo "[entrypoint] Starting application; TLS is terminated at Azure Front Door. Ensure AZURE_KEYVAULT_ENABLE=true in production."

# Finally exec the java process
exec java $JAVA_OPTS -jar /app/app.jar
SH

RUN chmod +x /usr/local/bin/entrypoint.sh

# No local keystore dir is created; TLS is managed by Azure Front Door / Key Vault

# Run as non-root user
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Use the custom entrypoint that starts the application
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
