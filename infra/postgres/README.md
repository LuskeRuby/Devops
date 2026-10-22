# PostgreSQL

The one definition of the database service. The root `docker-compose.yml` includes it; on a dedicated
database server it can run on its own.

| File | Purpose |
|---|---|
| `docker-compose.yml` | the service: image, healthcheck, volume, logging; no credentials |
| `pg_hba.dev.conf` | who may connect in dev (private ranges, any role, password required) |
| `pg_hba.prod.conf` | production on one host: Docker's private networks only, password required |
| `pg_hba.remote.conf.example` | template for a separate database server (TLS only) |
| `backup/backup.sh` | `pg_dump -Fc` with retention |

## Credentials

Credentials follow the repo's existing pattern and are not in this file:

- **Dev:** `docker-compose.override.yml` sets `POSTGRES_USER=admin` / `POSTGRES_PASSWORD=postgres`.
- **Prod:** `docker-compose.prod.yml` uses `PROD_DB_USER` / `PROD_DB_PASSWORD`, exported by the deploy job,
  and mounts `pg_hba.prod.conf` in place of the dev rules.
- **Standalone on its own server:** export `POSTGRES_USER` and `POSTGRES_PASSWORD` in the shell and
  mount the right `pg_hba` file (see below).

The application and Flyway use the same database user for now.
## Backups

```bash
./infra/postgres/backup/backup.sh            # ./backups, keeps the newest 7
```
