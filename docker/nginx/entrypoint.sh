#!/bin/sh
set -e

TEMPLATE="/etc/nginx/nginx.conf.template"
TARGET="/etc/nginx/nginx.conf"

# Provide safe defaults and export them so child processes (envsubst) can read them
export BACKEND_HOST="${BACKEND_HOST:-slowfall-backend.azurewebsites.net}"
export BACKEND_PORT="${BACKEND_PORT:-8080}"
export FRONTEND_HOST="${FRONTEND_HOST:-slowfall-frontend.azurewebsites.net}"
export CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-10m}"
export PROXY_READ_TIMEOUT="${PROXY_READ_TIMEOUT:-90s}"
export PROXY_SEND_TIMEOUT="${PROXY_SEND_TIMEOUT:-90s}"

if [ -f "$TEMPLATE" ]; then
  echo "Generating $TARGET from template"
  envsubst '\$BACKEND_HOST \$BACKEND_PORT \$FRONTEND_HOST \$CLIENT_MAX_BODY_SIZE \$PROXY_READ_TIMEOUT \$PROXY_SEND_TIMEOUT' < "$TEMPLATE" > "$TARGET"
fi

exec nginx -g 'daemon off;'
