FROM nginx:stable-alpine

# Remove default static files so proxy only reverse-proxies
RUN rm -rf /usr/share/nginx/html/*

# Install envsubst for templating
RUN apk add --no-cache gettext

# Copy template and entrypoint (explicit paths for repo-root context)
COPY docker/nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/nginx/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Do NOT bake frontend/dist into this proxy image; serve via frontend host

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
