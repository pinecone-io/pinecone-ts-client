import { Pinecone } from '../index';
import { generateRecords, sleep } from './test-helpers';

export const setup = async () => {
  const pc = new Pinecone();

  const serverlessIndexName = 'integration-test-serverless';
  const podIndexName = 'integration-test-pod';

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

  await pc.createIndex({
    name: podIndexName,
    dimension: 2,
    metric: 'dotproduct',
    spec: {
      pod: {
        podType: 'p1.x2',
        environment: 'us-east1-gcp',
      },
    },
    waitUntilReady: true,
  });

  // Export index names to env vars for global access
  process.env.SERVERLESS_INDEX_NAME = serverlessIndexName;
  process.env.POD_INDEX_NAME = podIndexName;

  // Seed indexes with data
  const recordsToUpsert = generateRecords({
    dimension: 2,
    quantity: 10,
    withSparseValues: true,
    withMetadata: true,
  });
  const recordIds = recordsToUpsert.map((r) => r.id);
  // Export record IDs to env vars for global access
  process.env.RECORD_IDS = recordIds.toString();

  const serverlessIndex = pc.index(serverlessIndexName);
  const podIndex = pc.index(podIndexName);

  // todo: have diff IDs per namespace?

  const globalNamespaceOne = 'global-ns-one';
  const globalNamespaceTwo = 'global-ns-two';
  // Export namespaces to env vars for global access
  process.env.GLOBAL_NS_ONE = globalNamespaceOne;
  process.env.GLOBAL_NS_TWO = globalNamespaceTwo;

  // upsert records into 2 namespaces in each index
  await serverlessIndex.namespace(globalNamespaceOne).upsert(recordsToUpsert);
  await serverlessIndex.namespace(globalNamespaceTwo).upsert(recordsToUpsert);
  await podIndex.namespace(globalNamespaceOne).upsert(recordsToUpsert);
  await podIndex.namespace(globalNamespaceTwo).upsert(recordsToUpsert);

  await sleep(10000); // Wait (10s) for indexes to be ready for querying after upsert
};
