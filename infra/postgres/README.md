# PostgreSQL

The one definition of the database service. The root `docker-compose.yml` includes it; on a dedicated
database server it can run on its own.

```bash
docker compose -f infra/postgres/docker-compose.yml --env-file infra/postgres/.env up -d
```

| File | Purpose |
|---|---|
| `docker-compose.yml` | the service: image, healthcheck, volume, logging, `pg_hba` selection |
| `init/01-roles.sh` | creates `app_owner`, `app_rw` and the `app` schema, **once** on an empty volume |
| `pg_hba.dev.conf` / `pg_hba.prod.conf` | who may connect; chosen with `PG_HBA=dev\|prod` in `.env` |
| `pg_hba.remote.conf.example` | template for a separate database server (TLS only) |
| `backup/backup.sh` | `pg_dump -Fc` with retention |

## Roles

| Role | Used by | Can |
|---|---|---|
| `admin` (superuser, `POSTGRES_USER`) | you: seeding, backups, debugging | everything. Over the network only in the dev profile |
| `app_owner` | Flyway (step 3); for now also the backend | owns schema `app`, can run DDL |
| `app_rw` | the running backend (step 3) | SELECT/INSERT/UPDATE/DELETE on tables in `app` |

The init script only runs when the data volume is empty. To start over in development:
`docker compose down -v && docker compose up`.

