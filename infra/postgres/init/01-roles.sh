#!/usr/bin/env bash
# Creates the application roles and schema. The postgres image runs this ONCE, when the
# data directory is empty. To change roles later use a Flyway migration or a manual
# runbook; editing this file does not affect an existing volume.
#
#   app_owner  owns the "app" schema; will be used by Flyway only
#   app_rw     data access only (SELECT/INSERT/UPDATE/DELETE); will be used by the running app
#
# The superuser (POSTGRES_USER) stays reserved for administration, seeding and backups.
set -euo pipefail

: "${DB_OWNER_PASSWORD:?DB_OWNER_PASSWORD is required}"
: "${DB_APP_PASSWORD:?DB_APP_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v owner_pw="$DB_OWNER_PASSWORD" -v app_pw="$DB_APP_PASSWORD" -v db="$POSTGRES_DB" <<'SQL'
-- Roles (idempotent). \gexec runs the generated CREATE ROLE statement, if any.
SELECT format('CREATE ROLE app_owner LOGIN PASSWORD %L', :'owner_pw')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_owner') \gexec
SELECT format('CREATE ROLE app_rw LOGIN PASSWORD %L', :'app_pw')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_rw') \gexec

-- Lock down the defaults: nobody gets in or creates objects unless granted.
REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db" TO app_owner, app_rw;

-- The application lives in its own schema, owned by app_owner.
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_rw;
ALTER ROLE app_owner SET search_path = app;
ALTER ROLE app_rw SET search_path = app;

-- Tables and sequences that app_owner creates later are automatically usable by app_rw.
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
SQL
