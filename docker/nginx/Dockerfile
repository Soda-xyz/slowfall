FROM nginx:stable-alpine

# Install envsubst (gettext) for templating
RUN apk add --no-cache gettext

# Copy template and entrypoint
# When the build context is the repository root (context: .) the files live under docker/nginx/
# Use explicit paths so CI (which sets context: . and file: docker/nginx/Dockerfile) can find them
COPY docker/nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/nginx/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# NOTE: Do NOT bake frontend/dist into the proxy image here.
# The frontend is served from its own App Service (or static host) and the proxy should only reverse-proxy /api/.
# If CI needs to package static assets into a distribution for other uses, publish the artifact separately.

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
