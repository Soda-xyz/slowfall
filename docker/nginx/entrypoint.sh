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

# Log container-identifying info early so platform logs can be correlated to this container
CONTAINER_HOSTNAME="$(hostname)"
# WEBSITE_INSTANCE_ID is set by App Service; fallback to unknown if missing
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"

if [ -f "$TEMPLATE" ]; then
  echo "Generating $TARGET from template"
  envsubst '\$BACKEND_HOST \$BACKEND_PORT \$FRONTEND_HOST \$CLIENT_MAX_BODY_SIZE \$PROXY_READ_TIMEOUT \$PROXY_SEND_TIMEOUT' < "$TEMPLATE" > "$TARGET"

  # Validate the generated nginx config and provide clear diagnostics on failure
  if ! nginx -t -c "$TARGET" 2>&1; then
    echo "nginx config test FAILED for container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
    echo "---- Begin generated nginx.conf (for debugging) ----"
    cat "$TARGET" || true
    echo "---- End generated nginx.conf ----"
    # Exit so the platform marks this start attempt as failed and you get clear logs
    exit 1
  else
    echo "nginx config test passed for container hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
  fi
fi

exec nginx -g 'daemon off;'
