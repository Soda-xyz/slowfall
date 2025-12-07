# docker/frontend/Dockerfile
# Stage 1: build the frontend with Node
FROM node:18-alpine AS build
WORKDIR /app
# Build args to control Vite mode and API URL
ARG VITE_FRONTEND_ENV=production
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package files first to leverage cache
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/ .
# Overwrite .env.production with build args to avoid committed file overriding CI
RUN printf 'VITE_API_BASE_URL=%s\nVITE_FRONTEND_ENV=%s\n' "${VITE_API_BASE_URL}" "${VITE_FRONTEND_ENV}" > .env.production || true
# Deterministic install when lockfile exists
RUN npm ci --silent
# Build with requested Vite mode
RUN npm run build -- --mode ${VITE_FRONTEND_ENV}

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS runtime
# Clear default static files
RUN rm -rf /usr/share/nginx/html/*
# Add curl for healthchecks
RUN apk add --no-cache curl
# Copy built files and set nginx ownership
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
# Install entrypoint for validation/diagnostics
COPY docker/frontend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
# Bake nginx config at build-time via build-args
ARG BACKEND_HOST=backend
ARG FRONTEND_HOST=frontend
# Write config template with placeholders
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
    # Forward all request headers so Authorization and cookies are preserved for backend.
    proxy_pass_request_headers on;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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

# Replace placeholders and write final config
RUN sed -e "s/{{BACKEND_HOST}}/${BACKEND_HOST}/g; s/{{FRONTEND_HOST}}/${FRONTEND_HOST}/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf \
  && rm /etc/nginx/conf.d/default.conf.template

# Entrypoint validates config and prints identifiers
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/sh","-c","exec nginx -g 'daemon off;' "]
