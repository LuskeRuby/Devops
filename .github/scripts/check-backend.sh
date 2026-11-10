#!/usr/bin/env bash
# Checks one backend instance on Server A. The release pipes it through ssh:
#   ssh host "DIR=... IP_BACKEND_WG=... bash -s -- <service> <port>" < .github/scripts/check-backend.sh
# It fails (and prints the service's log) if the instance does not answer on its own port, or if it
# did not connect to the message broker.
set -u
svc=$1
port=$2
cd ~/"$DIR" || exit 1
COMPOSE="docker compose --profile scale -f docker-compose.prod-backend.yml --env-file .env"

# 1. The instance answers on its own WireGuard address and port (not through nginx, which would
#    round-robin and could hide that one instance is down).
up=no
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "http://$IP_BACKEND_WG:$port/api/families/login")
  case "$code" in 4*) echo "$svc answers on port $port ($code)"; up=yes; break ;; esac
  echo "$svc not ready yet (HTTP $code)"; sleep 3
done
if [ "$up" != yes ]; then
  echo "::error::$svc did not answer on port $port after the deploy"
  $COMPOSE logs --tail 40 "$svc"
  exit 1
fi

# 2. The login probe does not touch the message broker. A wrong broker password, a closed tunnel port or
#    a stopped RabbitMQ leaves the instance up but chat dead, so check the connection to the broker too.
for i in $(seq 1 20); do
  if $COMPOSE logs "$svc" 2>/dev/null | grep -q '"System" session connected'; then
    echo "$svc is connected to the message broker"
    exit 0
  fi
  echo "waiting for $svc to connect to the message broker..."; sleep 3
done
echo "::error::$svc did not connect to RabbitMQ (check the RABBITMQ_* secrets, the tunnel and that rabbitmq is healthy on Server B)"
$COMPOSE logs --tail 40 "$svc"
exit 1
