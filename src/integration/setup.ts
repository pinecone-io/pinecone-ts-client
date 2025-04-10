import { Pinecone } from '../index';
import {
  diffPrefix,
  generateRecords,
  globalNamespaceOne,
  prefix,
  randomString,
  randomIndexName,
  sleep,
} from './test-helpers';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const setup = async () => {
  let apiKey: string;

  if (process.env['PINECONE_API_KEY'] === undefined) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  } else {
    apiKey = process.env['PINECONE_API_KEY'];
  }

  const client = new Pinecone({ apiKey: apiKey });

  // both of these processes create the external resources, and then store the names in the GITHUB_OUTPUT env var
  await Promise.all([createServerlessIndex(client), createAssistant(client)]);
};

// main entrypoint
setup();

async function createServerlessIndex(client: Pinecone) {
  let serverlessIndexName = randomIndexName('serverless-integration');
  const indexes = await client.listIndexes();
  const serverlessIndex = indexes.indexes?.find(
    (index) => index.spec.serverless
  );
  serverlessIndexName = serverlessIndex?.name || serverlessIndexName;

  const createAndSeedNewServerlessIndex = async (newIndexName: string) => {
    // Create serverless index for data plane tests
    await client.createIndex({
      name: newIndexName,
      dimension: 2,
      metric: 'dotproduct',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-west-2',
        },
      },
      waitUntilReady: true,
      tags: { project: 'pinecone-integration-tests-serverless' },
    });

    // Seed index with data
    const recordsToUpsert = generateRecords({
      prefix: prefix,
      dimension: 2,
      quantity: 10,
      withSparseValues: false,
      withMetadata: true,
    });

    // (Upsert 1 record with a different prefix, so can test prefix filtering)
    const oneRecordWithDiffPrefix = generateRecords({
      prefix: diffPrefix,
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });

    const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];

    // upsert records into namespace
    await client
      .index(newIndexName)
      .namespace(globalNamespaceOne)
      .upsert(allRecords);

    // wait for records to become available
    await sleep(25000);
  };

  // if there's not an existing serverlessIndex, create one
  if (!serverlessIndex) {
    await createAndSeedNewServerlessIndex(serverlessIndexName);
  }

  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`SERVERLESS_INDEX_NAME=${serverlessIndexName}`);
}

async function createAssistant(client: Pinecone) {
  // Set up an Assistant and upload a file to it
  const assistantName = randomString(5);
  await client.createAssistant({
    name: assistantName,
    instructions: 'test-instructions',
    metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
    region: 'us',
  });
  await sleep(5000);

  try {
    await client.describeAssistant(assistantName);
  } catch (e) {
    console.log('Error getting assistant:', e);
  }

  const assistant = client.Assistant(assistantName);

  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`ASSISTANT_NAME=${assistantName}`);

  const tempFileName = path.join(os.tmpdir(), `tempfile-${Date.now()}.txt`);

  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`TEST_FILE=${tempFileName}`);

  try {
    const data = 'This is some temporary data';
    fs.writeFileSync(tempFileName, data);
    console.log(`Temporary file created: ${tempFileName}`);
  } catch (err) {
    console.error('Error writing file:', err);
  }
  // Add a small delay to ensure file system sync
  await sleep(1000);

  // Upload file to assistant so chat works
  const file = await assistant.uploadFile({
    path: tempFileName,
    metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
  });

  console.log('File uploaded:', file);

  // Another sleep b/c it currently takes a *long* time for a file to be available
  await sleep(30000);

  // Delete file from local file system
  try {
    fs.unlinkSync(path.resolve(process.cwd(), tempFileName));
    console.log(`Temporary file deleted: ${tempFileName}`);
  } catch (err) {
    console.error('Error deleting file:', err);
  }
}
