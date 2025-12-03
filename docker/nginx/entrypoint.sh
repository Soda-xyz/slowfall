#!/bin/sh
set -e

TEMPLATE="/etc/nginx/nginx.conf.template"
TARGET="/etc/nginx/nginx.conf"

# Provide safe defaults if environment variables are missing
: "${BACKEND_HOST:=slowfall-backend.azurewebsites.net}"
: "${BACKEND_PORT:=8080}"
: "${FRONTEND_HOST:=slowfall-frontend.azurewebsites.net}"
: "${CLIENT_MAX_BODY_SIZE:=10m}"
: "${PROXY_READ_TIMEOUT:=90s}"
: "${PROXY_SEND_TIMEOUT:=90s}"

if [ -f "$TEMPLATE" ]; then
  echo "Generating $TARGET from template"
  envsubst '\$BACKEND_HOST \$BACKEND_PORT \$FRONTEND_HOST \$CLIENT_MAX_BODY_SIZE \$PROXY_READ_TIMEOUT \$PROXY_SEND_TIMEOUT' < "$TEMPLATE" > "$TARGET"
fi

exec nginx -g 'daemon off;'
