FROM nginx:stable-alpine

# Install envsubst (gettext) for templating
RUN apk add --no-cache gettext

# Copy template and entrypoint
# When the build context is the repository root (context: .) the files live under docker/nginx/
# Use explicit paths so CI (which sets context: . and file: docker/nginx/Dockerfile) can find them
COPY docker/nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/nginx/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Optional: copy static frontend build into the image if CI outputs it into 'frontend/dist'
# Uncomment in CI build if you want static assets baked into the proxy image.
# COPY frontend/dist/ /usr/share/nginx/html/

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
