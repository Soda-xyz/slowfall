#!/bin/sh
set -e

CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"

# --- RUNTIME FRONTEND CONFIG ---
# Create a small JSON file with runtime environment variables that the SPA can
# load at startup. This avoids baking build-time VITE_* env into the bundle and
# allows changing values without rebuilding the image.
CONFIG_PATH="/usr/share/nginx/html/config.json"
{
  echo '{'
  # Keep pseudo auth runtime keys if present so CI can still inject pseudo credentials
  echo "  \"VITE_PSEUDO_AUTH\": \"${VITE_PSEUDO_AUTH:-}\","
  echo "  \"VITE_PSEUDO_USER\": \"${VITE_PSEUDO_USER:-}\","
  echo "  \"VITE_PSEUDO_PASS\": \"${VITE_PSEUDO_PASS:-}\""
  echo '}'
} > "$CONFIG_PATH" || {
  echo "Failed to write runtime config to $CONFIG_PATH"
}

# Validate nginx config early and dump it on failure for easy diagnosis
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
