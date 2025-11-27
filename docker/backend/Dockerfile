# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /work

# Copy Gradle wrapper and build files first to leverage layer caching
COPY gradlew .
COPY gradle gradle
COPY settings.gradle settings.gradle.kts build.gradle* ./

# Ensure wrapper is executable
RUN chmod +x ./gradlew || true

# Copy the rest of the source
COPY . .

# Build the application jar (skip tests for faster local builds)
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: runtime image
FROM eclipse-temurin:21-jre AS runtime

# create a non-root user
RUN addgroup --system app && adduser --system --ingroup app app || true
WORKDIR /app

# Copy the Spring Boot fat jar from the builder stage
COPY --from=builder /work/build/libs/*.jar app.jar

# JVM options (override at runtime with JAVA_OPTS env var)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8080
EXPOSE 8080

# Optional: install curl for HEALTHCHECK (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* || true

# Run as non-root user
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
