import { Pinecone } from '../pinecone';

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

  // Delete serverless index
  if (fixtures.serverlessIndex?.name) {
    try {
      console.error(`📦 Deleting index: ${fixtures.serverlessIndex.name}`);
      await pc.deleteIndex(fixtures.serverlessIndex.name);
      console.error('✅ Index deleted');
    } catch (error) {
      console.error('❌ Failed to delete index:', error);
      // Continue with assistant cleanup even if index deletion fails
    }
  } else {
    console.error('⚠️  No serverless index name found in FIXTURES_JSON');
  }

  // Delete assistant
  if (fixtures.assistant?.name) {
    try {
      console.error(`🤖 Deleting assistant: ${fixtures.assistant.name}`);
      await pc.deleteAssistant(fixtures.assistant.name);
      console.error('✅ Assistant deleted');
    } catch (error) {
      console.error('❌ Failed to delete assistant:', error);
    }
  } else {
    console.error('⚠️  No assistant name found in FIXTURES_JSON');
  }

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
