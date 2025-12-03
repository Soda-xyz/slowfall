#!/bin/sh
set -e

CONTAINER_HOSTNAME="$(hostname)"
CONTAINER_INSTANCE_ID="${WEBSITE_INSTANCE_ID:-unknown}"

echo "Container startup: hostname=${CONTAINER_HOSTNAME} instance_id=${CONTAINER_INSTANCE_ID}"

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

