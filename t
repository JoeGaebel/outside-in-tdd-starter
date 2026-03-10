#!/bin/bash

# Script to run lint and tests in sequence
# If any command fails, the script will exit with a non-zero code

# Set up logging
LOG_DIR="$(dirname "$0")/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/t-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee "$LOG_FILE") 2>&1

# Set trap to catch errors and exit with a non-zero code
trap 'echo "Tests failed ❌"; echo "Log: $LOG_FILE"; exit 1' ERR

# Set -e to exit immediately if a command exits with a non-zero status
set -e

echo "Running lint..."
npm run lint

echo "Running typecheck..."
npm run typecheck

echo "Running unit tests..."
npm run test:unit

echo "Running e2e tests..."
npm run test:e2e

# If we reach this point, all commands succeeded
echo "Tests passed ✅"
echo "Log: $LOG_FILE"
exit 0
