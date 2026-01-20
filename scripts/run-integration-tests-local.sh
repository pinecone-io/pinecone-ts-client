#!/bin/bash
set -e

# Integration Test Runner for Local Development
# Runs the complete integration test flow: Setup → Test → Teardown
#
# Usage:
#   ./scripts/run-integration-tests-local.sh          # Run Node environment tests
#   ./scripts/run-integration-tests-local.sh edge     # Run Edge environment tests
#   ./scripts/run-integration-tests-local.sh --edge   # Run Edge environment tests

# Determine test environment
TEST_ENV="node"
if [[ "$1" == "edge" ]] || [[ "$1" == "--edge" ]]; then
  TEST_ENV="edge"
fi

# Run setup and capture output
echo "📦 Setting up test resources..."
SETUP_OUTPUT=$(npx ts-node ./src/integration/setup.ts 2>&1)

# Show setup logs
echo "$SETUP_OUTPUT" | grep -v "^FIXTURES_JSON=" || true

# Extract and export FIXTURES_JSON
export FIXTURES_JSON=$(echo "$SETUP_OUTPUT" | grep "^FIXTURES_JSON=" | cut -d'=' -f2-)

if [ -z "$FIXTURES_JSON" ]; then
  echo "❌ Failed to extract FIXTURES_JSON from setup output"
  exit 1
fi

echo ""
echo "🧪 Running integration tests (${TEST_ENV} environment)..."

# Run tests with the fixtures
set +e  # Don't exit on test failure
npm run test:integration:${TEST_ENV}
TEST_EXIT_CODE=$?
set -e

echo ""
echo "🧹 Cleaning up resources..."

# Always run teardown, even if tests failed
npx ts-node ./src/integration/teardown.ts

# Exit with test exit code
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All tests passed"
  exit 0
else
  echo ""
  echo "❌ Some tests failed"
  exit $TEST_EXIT_CODE
fi
