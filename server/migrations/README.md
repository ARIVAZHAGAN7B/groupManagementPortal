# Database Migrations

Knex migrations are the source of truth for database changes.

## Workflow

1. Create a new migration for every schema change:

   ```bash
   npx knex migrate:make add_example_column --knexfile knexfile.js
   ```

2. Put the SQL or Knex schema changes in the generated file.

3. Run locally:

   ```bash
   npm run migrate
   ```

4. Commit the migration file with the code that depends on it.

On backend startup, `server.js` runs pending migrations before starting the API. When the backend is redeployed from `main`, the deployed database is updated automatically.

Do not make schema-only changes directly in a local database without adding a migration.
