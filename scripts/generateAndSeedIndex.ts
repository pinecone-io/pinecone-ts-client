import dotenv from 'dotenv';
import { Pinecone } from '../dist';
import { generateRecords } from '../src/integration/test-helpers';

const INDEX_NAME = 'local-utility-index';
let API_KEY = '';

dotenv.config();

for (const envVar of ['PINECONE_API_KEY']) {
  if (!process.env[envVar]) {
    console.warn(`WARNING Missing environment variable ${envVar} in .env file`);
  } else {
    console.log(`INFO Found environment variable ${envVar} in .env file`);
    API_KEY = process.env[envVar];
  }
}

(async () => {
  const pinecone = new Pinecone({
    apiKey: API_KEY,
  });

  console.time('create-index-duration');
  await pinecone.createIndex({
    name: INDEX_NAME,
    dimension: 5,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    suppressConflicts: true,
    waitUntilReady: true,
  });
  console.log(
    `Index ${INDEX_NAME} created in ${console.timeEnd(
      'create-index-duration',
    )}ms`,
  );

  const index = pinecone.index(INDEX_NAME);
  const recordsToUpsert = generateRecords({ dimension: 5, quantity: 100 });

  console.time('seed-index-duration');
  await index.namespace('first-namespace').upsert(recordsToUpsert);
  await index.namespace('second-namespace').upsert(recordsToUpsert);
  console.log(
    `Index namespaces seeded in ${console.timeEnd('seed-index-duration')}ms`,
  );

  process.exit();
})();
