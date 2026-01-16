import { Pinecone } from '../pinecone';
import {
  generateRecords,
  globalNamespaceOne,
  prefix,
  diffPrefix,
  randomIndexName,
  waitUntilAssistantReady,
  waitUntilAssistantFileReady,
  waitUntilRecordsReady,
} from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Integration Test Setup Script
 *
 * Creates shared resources for integration tests and outputs a single
 * FIXTURES_JSON environment variable containing all resource information.
 *
 * This script runs:
 * - Once in CI (shared across all matrix jobs)
 * - Once locally (then run tests multiple times)
 *
 * Output format: FIXTURES_JSON={"serverlessIndex": {...}, "assistant": {...}}
 */

export const setup = async () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }

  const pc = new Pinecone({ apiKey });

  console.error('🎛️ Setting up integration test resources...');

  // Create serverless index
  const indexName = randomIndexName(prefix);
  console.error(`📦 Creating serverless index: ${indexName}`);

  const metadataFields = ['genre', 'year'];

  await pc.createIndex({
    name: indexName,
    dimension: 2,
    metric: 'dotproduct',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-west-2',
        schema: {
          fields: Object.fromEntries(
            metadataFields.map((field) => [field, { filterable: true }])
          ),
        },
      },
    },
    waitUntilReady: true,
    tags: { project: 'pinecone-integration-tests' },
  });

  // Seed with test data
  console.error(`\tSeeding index ${indexName} with test data...`);
  const recordsToUpsert = generateRecords({
    prefix: prefix,
    dimension: 2,
    quantity: 10,
    withSparseValues: false,
    withMetadata: true,
  });

  const oneRecordWithDiffPrefix = generateRecords({
    prefix: diffPrefix,
    dimension: 2,
    quantity: 1,
    withSparseValues: false,
    withMetadata: true,
  });

  const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];
  const recordIds = allRecords.map((record) => record.id);

  await pc
    .index({ name: indexName, namespace: globalNamespaceOne })
    .upsert(allRecords);

  // Wait for data to be indexed
  console.error('\tWaiting for data to be indexed...');
  await waitUntilRecordsReady(
    pc.index({ name: indexName, namespace: globalNamespaceOne }),
    globalNamespaceOne,
    allRecords.map((record) => record.id)
  );

  // Create assistant
  const assistantName = `test-assistant-${Date.now()}`;
  console.error(`🤖 Creating assistant: ${assistantName}`);

  await pc.createAssistant({
    name: assistantName,
    metadata: {
      test: 'integration-test',
    },
  });

  await waitUntilAssistantReady(assistantName);

  const assistant = pc.Assistant({ name: assistantName });

  // Upload test file
  const testFilePath = path.join(os.tmpdir(), `test-file-${Date.now()}.txt`);
  fs.writeFileSync(testFilePath, 'Sample content for assistant file testing');

  console.error(`\tUploading test file: ${testFilePath}`);
  const file = await assistant.uploadFile({
    path: testFilePath,
    metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
  });

  await waitUntilAssistantFileReady(assistantName, file.id);

  // Build fixtures object
  const fixtures = {
    serverlessIndex: {
      name: indexName,
      dimension: 2,
      metric: 'dotproduct',
      metadataFields,
      recordIds,
    },
    assistant: {
      name: assistantName,
      testFilePath: testFilePath,
    },
  };

  // Output as single JSON (use stdout for capture, stderr for logs)
  console.log(`FIXTURES_JSON=${JSON.stringify(fixtures)}`);

  console.error('✅ Integration setup complete');
  console.error('');
  console.error('To use these fixtures, set the environment variable:');
  console.error(`  export FIXTURES_JSON='${JSON.stringify(fixtures)}'`);

  return fixtures;
};

// Run setup when executed directly
if (require.main === module) {
  setup()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Setup script failed:', err);
      process.exit(1);
    });
}
