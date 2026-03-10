# Todo App

- Todo list application using Node, TypeScript, Next.js, Prisma, PostgreSQL
- Dockerized development environment

## Conventions

- Always use `./bin/dc` instead of `docker compose`
- `./bin/start-services` — starts containers, migrates, waits for health checks
- `./t` — runs lint, typecheck, unit tests, and E2E tests

**Services:** `dev` (Next.js, port 3001), `dev-test` (E2E test server, port 4001, separate `.next` cache), `postgres` (port 5433).

For Docker debugging, Prisma commands, and cache management, see `.claude/infrastructure.md`.
