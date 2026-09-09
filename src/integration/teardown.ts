import { Pinecone } from '../pinecone';
import { cleanupResources } from './test-helpers';

/**
 * Integration Test Teardown Script
 *
 * Cleans up shared resources created by the setup script.
 * Reads resource information from FIXTURES_JSON environment variable.
 */

export const teardown = async () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }

  const fixturesJson = process.env.FIXTURES_JSON;
  if (!fixturesJson) {
    throw new Error(
      'FIXTURES_JSON environment variable not set. Nothing to clean up.',
    );
  }

  let fixtures;
  try {
    fixtures = JSON.parse(fixturesJson);
  } catch (error) {
    throw new Error(
      `Failed to parse FIXTURES_JSON: ${error}. Value: ${fixturesJson}`,
      { cause: error },
    );
  }

  const pc = new Pinecone({ apiKey });

  console.error('🧹 Cleaning up integration test resources...');

  await cleanupResources(
    pc,
    fixtures.cleanupIndexes ??
      [
        fixtures.serverlessIndex?.name,
        fixtures.legacyVectors?.dense?.name,
        fixtures.legacyVectors?.sparse?.name,
      ].filter((name): name is string => typeof name === 'string'),
    fixtures.assistant?.name ? [fixtures.assistant.name] : [],
  );

  console.error('✅ Teardown complete!');
};

if (require.main === module) {
  teardown()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Teardown script failed:', err);
      process.exit(1);
    });
}
