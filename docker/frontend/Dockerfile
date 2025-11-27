# docker/frontend/Dockerfile
# Stage 1: build the frontend with Node
FROM node:18-alpine AS build
WORKDIR /app
# Copy only package files first for efficient caching
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/ .
RUN npm ci --legacy-peer-deps
RUN npm run build

# Stage 2: serve with nginx (production)
FROM nginx:stable-alpine AS runtime
# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*
# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config (provided alongside Dockerfile)
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://localhost/ || exit 1

CMD ["/bin/sh","-c","exec nginx -g 'daemon off;' "]

