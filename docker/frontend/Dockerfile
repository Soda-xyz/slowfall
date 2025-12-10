# docker/frontend/Dockerfile

# Seperation of concerns!!!

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

# Entrypoint validates config and prints identifiers
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/sh","-c","exec nginx -g 'daemon off;' "]
