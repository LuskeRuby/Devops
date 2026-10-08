#!/usr/bin/env bash
# Seeds the dev database. Start the dev stack first (docker compose up) and
# wait until the backend is up: Hibernate creates the tables on startup.
set -euo pipefail
cd "$(dirname "$0")"
echo "Seeding PostgreSQL database..."
docker compose exec -T postgres psql -U admin -d familyapp < seed.sql
echo "Seeding complete!"
