#!/usr/bin/env bash
# Logical backup of the app database with pg_dump (custom format), keeping the newest N.
#
#   ./infra/postgres/backup/backup.sh [backup-dir] [keep]     (defaults: ./backups, 7)
#
# Runs against the "postgres" service of the compose project in the repo root. On a
# dedicated database server set COMPOSE_FILE=infra/postgres/docker-compose.yml first.
# Cron example (daily 03:00):  0 3 * * * cd /path/to/repo && ./infra/postgres/backup/backup.sh
#
# Restore into an empty database (the init script has already created the roles):
#   docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --single-transaction' < backups/<file>.dump
set -euo pipefail

cd "$(dirname "$0")/../../.."
BACKUP_DIR="${1:-backups}"
KEEP="${2:-7}"
mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/familyapp-$(date +%Y%m%d-%H%M%S).dump"
TMP="$FILE.part"

# Dump to a temporary name; only a complete, non-empty dump gets the final name, so a failed
# run can never leave something that looks like a backup (or counts towards the retention).
if ! docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$TMP" || [ ! -s "$TMP" ]; then
  rm -f "$TMP"
  echo "Backup failed" >&2
  exit 1
fi
mv "$TMP" "$FILE"

# Keep the newest $KEEP dumps.
ls -1t "$BACKUP_DIR"/familyapp-*.dump | tail -n +"$((KEEP + 1))" | xargs -r rm --
echo "Backup written: $FILE"
