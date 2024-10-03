import { Pinecone } from '../index';
import {
  diffPrefix,
  generateRecords,
  globalNamespaceOne,
  prefix,
  serverlessIndexName,
  sleep,
} from './test-helpers';

// import fs from 'fs';

module.exports = async function () {
  await setup();
  return null; // todo: remove?
};

export const setup = async () => {
  // const path = process.env.GITHUB_ENV;

  const pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });

  // Create serverless index
  await pc.createIndex({
    name: serverlessIndexName,
    dimension: 2,
    metric: 'dotproduct',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-west-2',
      },
    },
    waitUntilReady: true,
  });

  // Seed index with data
  const recordsToUpsert = generateRecords({
    prefix: prefix,
    dimension: 2,
    quantity: 10,
    withSparseValues: true,
    withMetadata: true,
  });

  // (Upsert 1 record with a different prefix, so can test prefix filtering)
  const oneRecordWithDiffPrefix = generateRecords({
    prefix: diffPrefix,
    dimension: 2,
    quantity: 1,
    withSparseValues: true,
    withMetadata: true,
  });

  const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];
  // const recordIds = allRecords.map((r) => r.id);

  // Export record IDs to env vars for global access
  // process.env.RECORD_IDS = recordIds.toString();
  // const envVariable = `RECORD_IDS=${recordIds.toString()}\n`;
  // fs.appendFileSync(path!, envVariable);

  // upsert records into namespace
  await pc
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne)
    .upsert(allRecords);

  // Wait (10s) for indexes to be ready for querying after upsert
  await sleep(10000);
};
