#!/bin/sh

# entrypoint.sh
CONFIG_PATH=/usr/share/nginx/html/assets/config.json

cat <<EOF > $CONFIG_PATH
{
  "API_URL": "${BACKEND_URL:-http://localhost:3000}"
}
EOF

exec "$@"
