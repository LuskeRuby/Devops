#!/bin/bash
echo "Seeding PostgreSQL database..."
docker exec -i full-stack-app-postgres-1 psql -U admin -d familyapp < seed.sql
echo "Seeding complete!"