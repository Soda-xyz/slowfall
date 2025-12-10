#!/bin/sh
set -e

CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"

# Runtime config: write small JSON for SPA to read at startup (no rebuild needed)
CONFIG_PATH="/usr/share/nginx/html/config.json"
{
  echo '{'
  # pseudo-auth keys (if present)
  echo "  \"VITE_PSEUDO_AUTH\": \"${VITE_PSEUDO_AUTH:-}\","
  echo "  \"VITE_PSEUDO_USER\": \"${VITE_PSEUDO_USER:-}\","
  echo "  \"VITE_PSEUDO_PASS\": \"${VITE_PSEUDO_PASS:-}\""
  echo '}'
} > "$CONFIG_PATH" || {
  echo "Failed to write runtime config to $CONFIG_PATH"
}

# Validate nginx config; dump on failure
if ! nginx -t 2>&1; then
  echo "nginx config test FAILED for hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
  echo "---- Begin nginx -T output ----"
  nginx -T || true
  echo "---- End nginx -T output ----"
  exit 1
else
  echo "nginx config test passed for hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"
fi

exec nginx -g 'daemon off;'
