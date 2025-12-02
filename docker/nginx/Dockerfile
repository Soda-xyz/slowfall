FROM nginx:stable-alpine

# Install envsubst (gettext) for templating
RUN apk add --no-cache gettext

# Copy template and entrypoint
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Optional: copy static frontend build into the image if CI outputs it into 'frontend/dist'
# Uncomment in CI build if you want static assets baked into the proxy image.
# COPY frontend/dist/ /usr/share/nginx/html/

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

