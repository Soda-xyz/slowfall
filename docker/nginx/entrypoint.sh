#!/bin/sh
set -e

TEMPLATE="/etc/nginx/nginx.conf.template"
TARGET="/etc/nginx/nginx.conf"

# Defaults exported for envsubst
export BACKEND_HOST="${BACKEND_HOST:-slowfall-backend.azurewebsites.net}"
export BACKEND_PORT="${BACKEND_PORT:-}"
export FRONTEND_HOST="${FRONTEND_HOST:-slowfall-frontend.azurewebsites.net}"
export CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-10m}"
export PROXY_READ_TIMEOUT="${PROXY_READ_TIMEOUT:-90s}"
export PROXY_SEND_TIMEOUT="${PROXY_SEND_TIMEOUT:-90s}"

# Container identifiers for logs
CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"

# Generate nginx.conf from template if present
if [ -f "$TEMPLATE" ]; then
  echo "Generating $TARGET from template"
  envsubst '\$BACKEND_HOST \$BACKEND_PORT \$FRONTEND_HOST \$CLIENT_MAX_BODY_SIZE \$PROXY_READ_TIMEOUT \$PROXY_SEND_TIMEOUT' < "$TEMPLATE" > "$TARGET"

  # Validate generated config and dump on failure
  if ! nginx -t -c "$TARGET" 2>&1; then
    echo "nginx config test FAILED for container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
    echo "---- Begin generated nginx.conf (for debugging) ----"
    cat "$TARGET" || true
    echo "---- End generated nginx.conf ----"
    exit 1
  else
    echo "nginx config test passed for container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
  fi
fi

exec nginx -g 'daemon off;'
