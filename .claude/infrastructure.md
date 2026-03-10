# Infrastructure Reference

Loaded on demand by agents when debugging infrastructure issues.

## Docker Debugging

| Action | Command |
|--------|---------|
| Container status | `./bin/dc ps` |
| Dev server logs | `./bin/dc logs --tail=50 dev` |
| E2E server logs | `./bin/dc logs --tail=50 dev-test` |
| Restart a service | `./bin/dc restart dev` |
| Restart E2E server | `./bin/dc restart dev-test` |
| Restart everything | `./bin/dc down && ./bin/start-services` |
| Clear stale Turbopack cache | `./bin/dc down --volumes && ./bin/start-services` |
| Clear E2E test cache only | `./bin/dc --profile test stop dev-test && docker volume rm outside-in-tdd-starter_next_test_cache && ./bin/dc --profile test up -d --wait dev-test` |

**Turbopack cache symptoms:** "module not found" for packages that ARE installed. A simple restart won't fix it — the `.next` cache must be rebuilt from scratch.

**Turbopack CSS caching:** Turbopack does not reliably hot-reload CSS changes processed through PostCSS/Tailwind (e.g., new selector blocks in `globals.css`). JS changes hot-reload fine, but compiled CSS can go stale. After modifying any CSS file that goes through PostCSS/Tailwind, restart the dev server: `./bin/dc restart dev`.

**E2E cache note:** The `dev-test` container has its own `.next` cache volume (`next_test_cache`), independent from `dev`. Restarting `dev` does NOT update what Cypress sees. Clear the E2E test cache after modifying CSS directives, build-time config, or other changes requiring Turbopack recompilation.

**E2E test server:** Cypress tests hit `dev-test` (port 4001), NOT `dev` (port 3001). When debugging E2E failures, always check `dev-test` logs. Note: `run-cypress-tests.sh` automatically restarts `dev-test` on each run.

## Prisma Commands

| Action | Command |
|--------|---------|
| Detect changes + generate + apply (interactive) | `npm run prisma:migrate` |
| Apply pending migrations only (safe, no prompts) | `npm run prisma:migrate:deploy` |
| Create blank migration for custom SQL | `npm run prisma:create-only` |
| Regenerate client | `npm run prisma:generate` |

**Creating a new migration:** `npm run prisma:migrate -- --name <snake_case_description>` then `./bin/dc restart dev`.

**After `prisma:migrate:deploy`:** Follow with `npm run prisma:generate` to update the client.

## Test Database Isolation

Cypress E2E tests use a separate database (`todoapp_test`). `bin/run-cypress-tests.sh` manages the lifecycle: stops `dev-test`, drops and recreates the test DB, runs all migrations, then starts `dev-test` fresh. Every E2E run gets a clean database.
