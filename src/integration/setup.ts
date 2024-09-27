import { Pinecone } from '../index';

export const setup = async () => {
  const pc = new Pinecone();

  const serverlessIndexName = 'integration-test-serverless';
  const podIndexName = 'integration-test-pod';

  await pc.createIndex({
    name: serverlessIndexName,
    dimension: 2,
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
    metric: 'cosine',
    spec: {
      pod: {
        podType: 'p1.x2',
        environment: 'us-east1-gcp',
      },
    },
    waitUntilReady: true,
  });

  process.env.SERVERLESS_INDEX_NAME = serverlessIndexName; // now we can access these as env vars
  // globally (ie in tests)
  process.env.POD_INDEX_NAME = podIndexName;
};
