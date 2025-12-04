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
  echo "  \"VITE_MSAL_CLIENT_ID\": \"${VITE_MSAL_CLIENT_ID:-}\","
  echo "  \"VITE_MSAL_BACKEND_CLIENT_ID\": \"${VITE_MSAL_BACKEND_CLIENT_ID:-}\","
  echo "  \"VITE_MSAL_TENANT_ID\": \"${VITE_MSAL_TENANT_ID:-}\","
  echo "  \"VITE_MSAL_AUTHORITY\": \"${VITE_MSAL_AUTHORITY:-}\","
  echo "  \"VITE_MSAL_API_SCOPE\": \"${VITE_MSAL_API_SCOPE:-}\""
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
