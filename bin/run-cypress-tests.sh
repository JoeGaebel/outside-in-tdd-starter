#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
dc() { "$SCRIPT_DIR/dc" "$@"; }

TEST_DB_NAME="todoapp_test"
TEST_DATABASE_URL="postgresql://todoapp:todoapp@localhost:5433/${TEST_DB_NAME}?schema=public"

STARTED_DOCKER=false

cleanup() {
  local exit_code=$?

  if [ "$STARTED_DOCKER" = true ]; then
    echo "Stopping Docker containers (we started them)..."
    dc --profile test down
  fi

  exit $exit_code
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Track whether we need to start Docker
running_services=$(dc ps --status running --format '{{.Service}}' 2>/dev/null || true)
for svc in dev postgres; do
  if ! echo "$running_services" | grep -q "^${svc}$"; then
    STARTED_DOCKER=true
    break
  fi
done

# Skip start-services only if all base services are healthy
all_healthy=false
if [ "$STARTED_DOCKER" = false ]; then
  all_healthy=true
  for svc in dev postgres; do
    health=$(dc ps "$svc" --format '{{.Health}}' 2>/dev/null || true)
    if [ "$health" != "healthy" ]; then
      all_healthy=false
      break
    fi
  done
fi

if [ "$all_healthy" = false ]; then
  ./bin/start-services
fi

# Stop dev-test if running
echo "Stopping dev-test container..."
dc --profile test stop dev-test 2>/dev/null || true

# Recreate test database from scratch
echo "Recreating test database..."
dc exec -T postgres psql -U todoapp -d postgres \
  -c "DROP DATABASE IF EXISTS \"${TEST_DB_NAME}\";" \
  -c "CREATE DATABASE \"${TEST_DB_NAME}\" OWNER todoapp;"
echo "Running migrations on test database..."
DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_DIRECT="$TEST_DATABASE_URL" npm run prisma:migrate:deploy 2>&1 | tail -1

# Start dev-test fresh
echo "Starting dev-test container..."
dc --profile test up -d --wait dev-test

# Run Cypress
if [ "${1:-}" = "open" ]; then
  shift
  echo "Opening Cypress (interactive)..."
  CYPRESS_BASE_URL="http://localhost:4001" DATABASE_URL="$TEST_DATABASE_URL" npx cypress open "$@"
else
  echo "Running Cypress tests..."
  CYPRESS_BASE_URL="http://localhost:4001" DATABASE_URL="$TEST_DATABASE_URL" npx cypress run --quiet "$@"
fi
