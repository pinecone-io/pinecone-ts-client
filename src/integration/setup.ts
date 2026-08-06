import { Pinecone } from '../pinecone';
import {
  generateDocuments,
  globalNamespaceOne,
  prefix,
  diffPrefix,
  randomName,
  waitUntilAssistantReady,
  waitUntilAssistantFileReady,
  waitUntilRecordsReady,
  vectorFieldName,
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
  const indexName = randomName(prefix);
  console.error(`📦 Creating serverless index: ${indexName}`);

  // Generate test data first to extract metadata for filtering
  console.error(`\tGenerating test data...`);
  const documentsToUpsert = generateDocuments({
    prefix: prefix,
    dimension: 2,
    quantity: 10,
    withMetadata: true,
  });

  const oneDocumentWithDiffPrefix = generateDocuments({
    prefix: diffPrefix,
    dimension: 2,
    quantity: 1,
    withMetadata: true,
  });

  const allDocuments = [...oneDocumentWithDiffPrefix, ...documentsToUpsert];
  const recordIds = allDocuments.map((doc) => doc._id);

  // Extract a metadata key-value pair from the first document for filtering
  // tests. Document metadata lives in top-level fields, so exclude `_id` and
  // the vector field.
  const metadataKeys = Object.keys(allDocuments[0]).filter(
    (k) => k !== '_id' && k !== vectorFieldName,
  );
  if (metadataKeys.length === 0) {
    throw new Error('Generated documents have no metadata');
  }
  const metadataFilterKey = metadataKeys[0];
  const metadataFilterValue = allDocuments[0][metadataFilterKey];

  console.error(
    `\tUsing metadata filter: ${metadataFilterKey}=${metadataFilterValue}`,
  );

  // NOTE: metadata fields are no longer declared at index-creation time. As of
  // `2026-07` the create-time schema only accepts primary field types
  // (`dense_vector`, `sparse_vector`, `semantic_text`, and `string` with
  // `full_text_search`); plain metadata values are indexed automatically at
  // upsert. `metadataKeys` is therefore only used to pick a filter key below.
  await pc.indexes.create({
    name: indexName,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-west-2',
    },
    schema: {
      fields: {
        [vectorFieldName]: {
          type: 'dense_vector',
          dimension: 2,
          metric: 'dotproduct',
        },
      },
    },
    waitUntilReady: true,
    tags: { project: 'pinecone-integration-tests' },
  });

  // Seed with test data. Schema-based indexes must be written through the
  // documents API; the vectors and records APIs are rejected for them.
  console.error(`\tSeeding index ${indexName} with test data...`);

  await pc
    .index({ name: indexName, namespace: globalNamespaceOne })
    .upsertDocuments({ documents: allDocuments });

  // Wait for data to be indexed
  console.error('\tWaiting for data to be indexed...');
  await waitUntilRecordsReady(
    pc.index({ name: indexName, namespace: globalNamespaceOne }),
    globalNamespaceOne,
    recordIds,
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
  const uploadOp = await assistant.uploadFile({
    path: testFilePath,
    metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
  });

  if (!uploadOp.fileId) {
    throw new Error('Upload operation did not return a file ID');
  }
  await waitUntilAssistantFileReady(assistantName, uploadOp.fileId);

  // Build fixtures object
  const fixtures = {
    serverlessIndex: {
      name: indexName,
      dimension: 2,
      metric: 'dotproduct',
      vectorFieldName,
      metadataFilter: {
        key: metadataFilterKey,
        value: metadataFilterValue,
      },
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
