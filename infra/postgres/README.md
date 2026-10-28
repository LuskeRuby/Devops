# PostgreSQL

The one definition of the database service. The root `docker-compose.yml` includes it (dev and CI), and
`docker-compose.prod-frontend.yml` includes it on Server B.

| File | Purpose |
|---|---|
| `docker-compose.yml` | the service: image, healthcheck, volume, logging; credentials, bind address and pg_hba file come from variables |
| `pg_hba.dev.conf` | who may connect in dev (private ranges, any role, password required) |
| `pg_hba.prod.conf` | production (Server B): only the backend on Server A (`10.8.0.2/32`, over WireGuard), password required |
| `pg_hba.remote.conf.example` | template for a separate database server (TLS only) |
| `backup/backup.sh` | `pg_dump -Fc` with retention |

## Configuration per environment

The service reads these variables; each environment supplies them differently:

| Variable | Dev / CI | Production (Server B) |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | `docker-compose.override.yml` / `docker-compose.ci.yml` set `admin` / `postgres` | `.env` on Server B, written by the release workflow from the `PROD_DB_USER` / `PROD_DB_PASSWORD` secrets |
| `POSTGRES_BIND` | not set: `127.0.0.1` | Server B's WireGuard address (`IP_FRONTEND_WG`) |
| `PG_HBA_FILE` | not set: `pg_hba.dev.conf` | `pg_hba.prod.conf` |

`docker-compose.prod-frontend.yml` stops with an error if a production value is missing, so Server B never
starts with the dev defaults. The credentials are read only when the data volume is first created; changing
them later does not change an existing database (use `ALTER USER`). `pg_hba.prod.conf` contains the backend's
WireGuard address as a literal, because that file cannot read variables: if the address changes, edit the
file too.

The application and Flyway use the same database user for now.

## Backups

```bash
./infra/postgres/backup/backup.sh            # ./backups, keeps the newest 7
```

On Server B (production) the compose file is not the default one, so name it first:

```bash
COMPOSE_FILE=docker-compose.prod-frontend.yml ./infra/postgres/backup/backup.sh
```