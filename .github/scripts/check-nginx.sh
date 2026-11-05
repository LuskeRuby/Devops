#!/usr/bin/env bash
# Renders frontend/nginx.conf.template the way the container does and lets nginx check the result.
#   check-nginx.sh <number of backend instances>
# Needs Docker and ./certs/cert.pem + ./certs/key.pem (any certificate, nginx -t only loads it).
set -euo pipefail
count=$1

servers=$(bash .github/scripts/backend-servers.sh 10.8.0.2 "$count")

# Use the filter from the compose file, so a variable missing from it fails here and not in production.
filter=$(sed -n 's/.*NGINX_ENVSUBST_FILTER: "\(.*\)"/\1/p' docker-compose.prod-frontend.yml)
[ -n "$filter" ] || { echo "::error::NGINX_ENVSUBST_FILTER not found in docker-compose.prod-frontend.yml"; exit 1; }

rendered=$(docker run --rm \
  -e IP_FRONTEND_PUBLIC=203.0.113.10 -e "BACKEND_SERVERS=$servers" \
  -e "NGINX_ENVSUBST_FILTER=$filter" \
  -v "$PWD/frontend/nginx.conf.template:/etc/nginx/templates/default.conf.template:ro" \
  -v "$PWD/certs:/etc/nginx/ssl:ro" \
  --entrypoint sh nginx:alpine \
  -c '/docker-entrypoint.d/20-envsubst-on-templates.sh >/dev/null && nginx -t >&2 && cat /etc/nginx/conf.d/default.conf')

echo "$rendered" | sed -n '/^upstream/,/^}/p'
found=$(grep -oE 'server 10\.8\.0\.2:80[0-9]+' <<<"$rendered" | wc -l)
[ "$found" = "$count" ] || { echo "::error::expected $count backend server(s) in the upstream, found $found"; exit 1; }
if grep -q '\${' <<<"$rendered"; then echo "::error::an unsubstituted \${...} is left in the config"; exit 1; fi
echo "ok: nginx accepts the config with $found backend server(s)"
