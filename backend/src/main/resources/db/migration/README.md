# Database migrations (Flyway)

Flyway runs when the backend starts and applies every new `V<n>__<description>.sql` in order.
Hibernate only checks the result (`spring.jpa.hibernate.ddl-auto=validate`), so an entity that no
longer matches the schema stops the backend from starting, and the integration tests catch it first.

## Rules

- **Never edit or rename a migration that has been applied anywhere** (dev, CI, prod). Flyway checks
  each file's checksum and refuses to start if it changed. Fix forward with a new version.
- Name files `V<n>__<snake_case_description>.sql`: sequential integers, two underscores. One concern per
  migration. Repeatable `R__` files are only for views or functions.
- Schema (DDL) only. Seed and test data live in `scripts/seed/`, not here. Reference data the app needs
  to start is fine.
- Use lowercase `snake_case` identifiers, no quoting. Name constraints and indexes explicitly
  (`pk_`, `fk_<table>_<column>`, `uq_`, `ix_`) and **index every foreign key column**; PostgreSQL does not.
- Make changes **backward compatible** (expand, then contract). Two backend instances may run during a
  deploy, and the old version must still work against the new schema: add a nullable column or a new
  table first, switch the code, and drop the old column in a later release.
- PostgreSQL runs DDL inside a transaction, so a migration either applies fully or not at all.
  `CREATE INDEX CONCURRENTLY` cannot run in a transaction; it needs a `V<n>__x.sql.conf` file containing
  `executeInTransaction=false`.
- `flyway.clean-disabled=true` stays on in every environment: `clean` would drop the whole database.

## Adding a change

1. Change the entity.
2. Add `V<next>__what_changed.sql`.
3. Run `./mvnw verify`. The integration tests start PostgreSQL, apply all migrations and let Hibernate
   validate the entities against them.
