#!/usr/bin/env bash
# Seeds the dev database. Start the dev stack first (docker compose up) and
# wait until the backend is up: Flyway creates the tables on startup.
# Override the defaults with POSTGRES_USER / POSTGRES_DB if you changed them.
set -euo pipefail
# Run from the repo root so docker compose finds docker-compose.yml.
cd "$(dirname "$0")/../.."
echo "Seeding PostgreSQL database..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-admin}" -d "${POSTGRES_DB:-familyapp}" < scripts/seed/seed.sql
echo "Seeding complete!"
