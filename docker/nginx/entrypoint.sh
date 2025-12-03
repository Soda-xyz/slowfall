#!/bin/sh
set -e

TEMPLATE="/etc/nginx/nginx.conf.template"
TARGET="/etc/nginx/nginx.conf"

# Provide safe defaults (exported so child processes like envsubst see them)
export BACKEND_HOST="${BACKEND_HOST:-slowfall-backend.azurewebsites.net}"
export BACKEND_PORT="${BACKEND_PORT:-8080}"
export FRONTEND_HOST="${FRONTEND_HOST:-slowfall-frontend.azurewebsites.net}"
export CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-10m}"
export PROXY_READ_TIMEOUT="${PROXY_READ_TIMEOUT:-90s}"
export PROXY_SEND_TIMEOUT="${PROXY_SEND_TIMEOUT:-90s}"

# Show configured runtime values for debugging
echo "NGINX env: BACKEND_HOST=$BACKEND_HOST BACKEND_PORT=$BACKEND_PORT FRONTEND_HOST=$FRONTEND_HOST CLIENT_MAX_BODY_SIZE=$CLIENT_MAX_BODY_SIZE PROXY_READ_TIMEOUT=$PROXY_READ_TIMEOUT PROXY_SEND_TIMEOUT=$PROXY_SEND_TIMEOUT"

if [ -f "$TEMPLATE" ]; then
  echo "Generating $TARGET from template"
  envsubst '\$BACKEND_HOST \$BACKEND_PORT \$FRONTEND_HOST \$CLIENT_MAX_BODY_SIZE \$PROXY_READ_TIMEOUT \$PROXY_SEND_TIMEOUT' < "$TEMPLATE" > "$TARGET"

  # Basic validation: ensure no obvious empty host placeholders made it into the generated config.
  # Look for patterns like "server :" (empty host before port) or "proxy_pass http://;" (empty host in proxy_pass).
  if grep -nE "server\s+:|proxy_pass\s+http://\s*;" "$TARGET" >/dev/null 2>&1; then
    echo "ERROR: Rendered nginx config appears to contain empty upstream/host entries" >&2
    echo "----- Generated nginx.conf -----" >&2
    sed -n '1,200p' "$TARGET" >&2 || true
    echo "--------------------------------" >&2
    echo "Ensure BACKEND_HOST and FRONTEND_HOST are set (they may be provided as App Settings / environment variables)." >&2
    exit 1
  fi
fi

exec nginx -g 'daemon off;'
