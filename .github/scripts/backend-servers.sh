#!/usr/bin/env bash
# Prints the nginx `server` lines for BACKEND_COUNT backend instances (one line of text):
#   backend-servers.sh <backend WireGuard address> <count>
# Instance N listens on port 8079+N. Used by release.yml and the PR checks, so both build it the same way.
set -euo pipefail
address=$1
count=$2
out=""
for i in $(seq 1 "$count"); do
  out="$out${out:+ }server $address:$((8079 + i)) max_fails=3 fail_timeout=10s;"
done
printf '%s\n' "$out"
