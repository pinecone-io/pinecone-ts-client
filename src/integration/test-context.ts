import type {
  IntegrationFixtures,
  FixtureManager,
} from './shared-fixtures-singleton';

// Extend global to include our fixture manager accessor
declare global {
  function getSharedFixtureManager(): FixtureManager | null;
}

/**
 * Get the shared integration test fixtures.
 *
 * This provides type-safe access to shared integration test resources:
 * - Pinecone client
 * - Pre-configured serverless index
 * - Assistant with uploaded test file
 *
 * The fixtures are lazily initialized on first access through the
 * custom Jest environment, and shared across all test files in the same test run.
 *
 * @example
 * ```typescript
 * import { getTestContext } from '../../test-context';
 *
 * let fixtures: IntegrationFixtures;
 *
 * beforeAll(async () => {
 *   fixtures = await getTestContext();
 * });
 *
 * test('example', () => {
 *   const index = fixtures.client.index({
 *     name: fixtures.serverlessIndex.name,
 *     namespace: 'my-namespace',
 *   });
 * });
 * ```
 */
export const getTestContext = async (): Promise<IntegrationFixtures> => {
  // Access via global function injected by custom environment
  const manager = global.getSharedFixtureManager();

  if (!manager) {
    throw new Error(
      'Fixture manager not initialized by custom Jest environment'
    );
  }

  return manager.getFixtures();
};

// Re-export the type for convenience
export type { IntegrationFixtures };
