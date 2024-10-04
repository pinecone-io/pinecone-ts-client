import { IndexList, Pinecone } from '../index';
import {
  diffPrefix,
  generateRecords,
  globalNamespaceOne,
  prefix,
  serverlessIndexName,
  sleep,
} from './test-helpers';

const setup = async () => {
  const pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });

  const indexes: IndexList = await pc.listIndexes();
  console.log('Present indexes', indexes);

  if (indexes.indexes) {
    if (indexes.indexes.some((index) => index.name === serverlessIndexName)) {
      console.log('Index already exists, not recreating');
      console.log('Seeding....');

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

      //   upsert records into namespace
      await pc
        .index(serverlessIndexName)
        .namespace(globalNamespaceOne)
        .upsert(allRecords);

      await sleep(10000);
    } else {
      console.log(
        'Serverless index does not exist, creating and seeding index'
      );

      // Create serverless index for data plane tests
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

      //   upsert records into namespace
      await pc
        .index(serverlessIndexName)
        .namespace(globalNamespaceOne)
        .upsert(allRecords);

      await sleep(10000);
    }
  }
};

setup();
