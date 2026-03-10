#!/bin/sh
set -e

HASH_FILE="/app/node_modules/.package-lock-hash"
CURRENT_HASH=$(md5sum /app/package-lock.json | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$CURRENT_HASH" ]; then
  echo "Dependencies changed — running npm install..."
  npm install
  echo "$CURRENT_HASH" > "$HASH_FILE"
fi

# Clear stale Turbopack cache
find /app/.next -mindepth 1 -delete 2>/dev/null || true

exec "$@"
