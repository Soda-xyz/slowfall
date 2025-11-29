# docker/frontend/Dockerfile
# Stage 1: build the frontend with Node
FROM node:18-alpine AS build
WORKDIR /app
# Build args allow CI to control Vite mode and VITE_ env replacements
ARG VITE_FRONTEND_ENV=production
# Default VITE_API_BASE_URL is intentionally empty for production so that
# the app's runtime API base becomes '/api/...' when intended. CI/workflows
# can pass a different build-arg for development (for example 'http://localhost:8080').
ARG VITE_API_BASE_URL=""
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
# Bake nginx config at build-time. BACKEND_HOST is a build-arg (defaults to 'backend')
ARG BACKEND_HOST=backend
# Write config template with a placeholder, then replace the placeholder at build time with the ARG value.
RUN cat > /etc/nginx/conf.d/default.conf.template <<'TEMPLATE'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    # BACKEND_HOST may include a host:port already (for example 'backend:8080' or an FQDN).
    # Use HTTPS to contact the backend public host so App Service TLS termination and redirects are preserved.
    proxy_pass https://{{BACKEND_HOST}};
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    # Set Host to the upstream host (so backend-generated absolute redirects use the backend FQDN)
    proxy_set_header Host $proxy_host;
    # Ensure TLS SNI uses the upstream host name
    proxy_ssl_server_name on;
    proxy_ssl_name $proxy_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;
    proxy_connect_timeout 5s;
    proxy_read_timeout 60s;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(?:css|js|json|xml|svg|png|jpg|jpeg|gif|ico)$ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "no-referrer-when-downgrade";
}
TEMPLATE

# Replace the placeholder with the build-arg value (Dockerfile expands ${BACKEND_HOST} here) and write final config.
RUN sed -e "s/{{BACKEND_HOST}}/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf \
  && rm /etc/nginx/conf.d/default.conf.template

CMD ["/bin/sh","-c","exec nginx -g 'daemon off;' "]
