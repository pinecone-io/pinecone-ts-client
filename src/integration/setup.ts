import { IndexList, Pinecone } from '../index';
import {
  diffPrefix,
  generateRecords,
  globalNamespaceOne,
  prefix,
  randomString,
  sleep,
} from './test-helpers';

import * as fs from 'fs';

// todo: refactor to make conditions & loops more efficient

const setup = async () => {
  let apiKey: string;

  if (process.env['PINECONE_API_KEY'] === undefined) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  } else {
    apiKey = process.env['PINECONE_API_KEY'];
  }

  const pc = new Pinecone({ apiKey: apiKey });

  const randomIndexName = `serverless-integration-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const indexes: IndexList = await pc.listIndexes();

  // if (indexes.indexes) {
  //   if (indexes.indexes.some((index) => index.name === randomIndexName)) {
  //     // Seed index with data
  //     const recordsToUpsert = generateRecords({
  //       prefix: prefix,
  //       dimension: 2,
  //       quantity: 10,
  //       withSparseValues: true,
  //       withMetadata: true,
  //     });
  //
  //     // (Upsert 1 record with a different prefix, so can test prefix filtering)
  //     const oneRecordWithDiffPrefix = generateRecords({
  //       prefix: diffPrefix,
  //       dimension: 2,
  //       quantity: 1,
  //       withSparseValues: true,
  //       withMetadata: true,
  //     });
  //
  //     const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];
  //
  //     //   upsert records into namespace
  //     await pc
  //       .index(randomIndexName)
  //       .namespace(globalNamespaceOne)
  //       .upsert(allRecords);
  //
  //     await sleep(10000);
  //   } else {
  //     // Create serverless index for data plane tests
  //     await pc.createIndex({
  //       name: randomIndexName,
  //       dimension: 2,
  //       metric: 'dotproduct',
  //       spec: {
  //         serverless: {
  //           cloud: 'aws',
  //           region: 'us-west-2',
  //         },
  //       },
  //       waitUntilReady: true,
  //       tags: { project: 'pinecone-integration-tests-serverless' },
  //     });
  //
  //     // Seed index with data
  //     const recordsToUpsert = generateRecords({
  //       prefix: prefix,
  //       dimension: 2,
  //       quantity: 10,
  //       withSparseValues: true,
  //       withMetadata: true,
  //     });
  //
  //     // (Upsert 1 record with a different prefix, so can test prefix filtering)
  //     const oneRecordWithDiffPrefix = generateRecords({
  //       prefix: diffPrefix,
  //       dimension: 2,
  //       quantity: 1,
  //       withSparseValues: true,
  //       withMetadata: true,
  //     });
  //
  //     const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];
  //
  //     //   upsert records into namespace
  //     await pc
  //       .index(randomIndexName)
  //       .namespace(globalNamespaceOne)
  //       .upsert(allRecords);
  //
  //     await sleep(10000);
  //   }
  // }
  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`SERVERLESS_INDEX_NAME=${randomIndexName}`);

  // Set up an Assistant and upload a file to it
  // console.log("setting up assistant");
  const assistantName = randomString(5);
  // console.log("assistant name = ", assistantName);
  await pc.assistant.createAssistant({
    name: assistantName,
    instructions: 'test-instructions',
    metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
    region: 'us',
  });
  await sleep(2000);

  try {
    await pc.assistant.getAssistant(assistantName);
  } catch (e) {
    console.log('Error getting assistant:', e);
  }

  const assistant = pc.Assistant(assistantName);

  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`ASSISTANT_NAME=${assistantName}`);

  const tempFileName = `tempfile-${Date.now()}.txt`;

  // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
  console.log(`TEST_FILE=${tempFileName}`);

  const data = 'This is some temporary data';
  fs.writeFileSync(tempFileName, data);

  // Add a small delay to ensure file system sync
  await sleep(1000);

  // Upload file to assistant so chat works
  await assistant.uploadFile({ path: tempFileName });
  await sleep(25000);
};

setup();
