# docker/frontend/Dockerfile
# Stage 1: build the frontend with Node
FROM node:18-alpine AS build
WORKDIR /app
# Build args allow CI to control Vite mode and VITE_ env replacements
ARG VITE_FRONTEND_ENV=production
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy only package files first for efficient caching
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/ .
# Enforce deterministic install when lockfile exists
RUN npm ci --silent
# Run the build with the requested Vite mode
RUN npm run build -- --mode ${VITE_FRONTEND_ENV}

# Stage 2: serve with nginx (production)
FROM nginx:stable-alpine AS runtime
# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*
# Install curl for HEALTHCHECK
RUN apk add --no-cache curl
# Copy built files from the build stage and set ownership to nginx user
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
# Copy nginx config (provided alongside Dockerfile)
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["/bin/sh","-c","exec nginx -g 'daemon off;' "]
