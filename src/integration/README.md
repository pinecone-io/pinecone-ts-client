# Integration Test Harness

## Overview

Integration tests use a simple environment variable approach where all test fixtures are passed via a single `FIXTURES_JSON` environment variable. This approach:

- **Efficient** - Setup runs once, shared across all test runs
- **Type safe** - JSON is parsed into typed interfaces
- **Easy to extend** - Add new JSON fields through updating `IntegrationFixtures`

### Setup Script (`src/integration/setup.ts`)

1. Creates serverless index with test data
2. Creates assistant with uploaded test file
3. Outputs `FIXTURES_JSON={"serverlessIndex":{...},"assistant":{...}}`

### Test Files

1. Import `getTestContext()` from `test-context.ts`
2. Reads and parses `FIXTURES_JSON` environment variable
3. Returns typed `IntegrationFixtures` object with client and resources

### Teardown Script (`src/integration/teardown.ts`)

1. Reads `FIXTURES_JSON` environment variable
2. Deletes the index and assistant

## Running Tests

### Locally

```bash
# Setup → Test → Teardown (Node environment)
npm run test:integration:local

# Setup → Test → Teardown (Edge environment)
npm run test:integration:local:edge

# Or use the script directly
./scripts/run-integration-tests-local.sh       # Node environment
./scripts/run-integration-tests-local.sh edge  # Edge environment
```

### Locally - Manual Control

```bash
# Run setup once
npm run integration:setup

# Copy the FIXTURES_JSON value from output and export it
export FIXTURES_JSON='{"serverlessIndex":{"name":"..."},...}'

# Run tests as many times as you want
npm run test:integration:node
npm run test:integration:edge

# Cleanup when done
npm run integration:teardown
```

### In CI

Tests automatically use `FIXTURES_JSON` set by the setup job. The matrix runs Node 22 and 24 with npm and Bun. All matrix jobs share the same resources, so suites use unique namespaces and remove every namespace they create.

Schema field names, dimensions, metrics, deployment location, and seeded record IDs are carried in the fixture JSON. Assertions should use those values instead of duplicating setup constants. Local HTTP retry tests use an ephemeral loopback port and a mock API key.

## CI Workflow

```
┌──────────────────┐
│  Setup Job       │  Creates resources, outputs FIXTURES_JSON
│  (runs once)     │
└────────┬─────────┘
         │
         ├───────────────────────────────────────────┐
         ▼                                           ▼
┌──────────────────┐                        ┌──────────────────┐
│ Integration      │                        │ Integration      │
│ Tests Job 1      │         ...            │ Tests Job 4      │
│ (Node 22 + npm)  │                        │ (Node 24 + bun)  │
│ Uses FIXTURES_JSON                        │ Uses FIXTURES_JSON
└────────┬─────────┘                        └────────┬─────────┘
         │                                           │
         └───────────────┬───────────────────────────┘
                         ▼
                ┌──────────────────┐
                │  Teardown Job    │  Deletes resources
                │  (runs once)     │
                └──────────────────┘
```

## Architecture

### Key Files

**Core:**

- `src/integration/test-context.ts` - Parses FIXTURES_JSON, provides typed access
- `src/integration/setup.ts` - Creates resources, outputs JSON
- `src/integration/teardown.ts` - Cleans up resources

**Scripts:**

- `scripts/run-integration-tests-local.sh` - All-in-one runner (accepts 'edge' flag)

**Config:**

- `jest.config.integration-node.js` - Standard Jest config (no custom environment)
- `jest.config.integration-edge.js` - Extends Node config with Edge runtime
- `.github/workflows/testing.yml` - CI workflow with setup/teardown jobs

### FIXTURES_JSON Structure

```json
{
  "serverlessIndex": {
    "name": "test-index-1234567890",
    "dimension": 2,
    "metric": "dotproduct",
    "deployment": { "cloud": "aws", "region": "us-west-2" },
    "vectorFieldName": "embedding",
    "metadataFilter": { "key": "genre", "value": "comedy" },
    "recordIds": ["record-1"]
  },
  "assistant": {
    "name": "test-assistant-1234567890",
    "testFilePath": "/tmp/test-file-1234567890.txt"
  }
}
```

## Usage in Tests

```typescript
import { getTestContext, IntegrationFixtures } from '../test-context';

let fixtures: IntegrationFixtures;

beforeAll(async () => {
  fixtures = await getTestContext();
});

test('example', () => {
  const index = fixtures.client.index({
    name: fixtures.serverlessIndex.name,
    namespace: 'my-namespace',
  });
  // ... test code
});
```

## Disabled and opt-in coverage

Every `test.skip`, `it.skip`, `describe.skip`, disabled shorthand (`xit`, `xtest`, `xdescribe`), or conditional alias that selects a Jest skip must have a tracked reason. Add a leading comment to the skipped statement, its enclosing suite, or the conditional alias declaration:

```typescript
// @integration-skip #35: dense-only indexes return empty results despite fetched documents.
describe.skip('dense-only search', () => {
  /* tests */
});
```

The keyless `integrationSkipInventory.test.ts` unit test parses the integration TypeScript syntax without executing suites or provisioning resources. It recognizes parameterized/computed skips and opt-in gates. An annotation on an enclosing suite applies to its descendants; an unrelated adjacent suite's annotation does not. Remove the annotation when re-enabling the last skipped test in that scope. Issue numbers refer to this repository and the reason must explain what enables the coverage.

The current dense-only search and filter-fetch limitations are tracked in #35 and #17. Integrated inference is active, so the old #16 skip is no longer inventoried. Document bulk import fixture provisioning remains #38. Slow backup-content and bulk-completion checks and the collections source-pod fixture are explicit opt-in coverage: their conditional skip declarations should name #117, #38, and #21 respectively and document the required environment variable next to the gate. Default lifecycle tests remain active.
