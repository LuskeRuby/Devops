#!/usr/bin/env bash
# Fails if the server has too little free disk space. The release pipes it through ssh:
#   ssh host "bash -s -- '<label>' <minimum free GB>" < .github/scripts/check-disk.sh
# Looks at / because Docker's data (/var/lib/docker) lives there on these servers.
set -eu
label=$1
min=$2

free_kb=$(df -Pk / | awk 'NR==2 {print $4}')
free_gb=$((free_kb / 1024 / 1024))
echo "$label: $free_gb GB free on / (the release needs at least $min GB)"

if [ "$free_gb" -lt "$min" ]; then
  echo "::error::$label has only $free_gb GB free, less than the $min GB the release needs. Free space first (docker image prune -a, docker builder prune, sudo journalctl --vacuum-size=200M) or grow the disk. Never prune Docker volumes: Postgres data lives in one."
  exit 1
fi
