import { Pinecone } from '@pinecone-database/pinecone';
import { appendFileSync } from 'fs';
import { EOL } from 'os';

function readEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function randomString(length: number): string {
  const result = [];
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join('');
}

function randomEmbeddingValues(dimension: number = 2): number[] {
  const result = [];
  for (let i = 0; i < dimension; i++) {
    result.push(parseFloat(Math.random().toPrecision(4)));
  }
  return result;
}

function writeGithubOutput(key: string, value: string): void {
  const output = process.env['GITHUB_OUTPUT'];
  if (output) {
    appendFileSync(output, `${key}=${value}${EOL}`);
  }
}

(async () => {
  const apiKey = readEnvVar('PINECONE_API_KEY');
  const environment = readEnvVar('PINECONE_ENVIRONMENT');
  const indexNamePrefix = readEnvVar('INDEX_NAME_PREFIX');
  const dimension = parseInt(readEnvVar('DIMENSION'));
  const metric = readEnvVar('METRIC');
  const numRecordsToUpsert = parseInt(readEnvVar('RECORDS_TO_UPSERT'));

  const indexName = `${indexNamePrefix}-${randomString(10)}`;
  writeGithubOutput('INDEX_NAME', indexName);
  console.info(`Creating index ${indexName}...`);

  console.info(
    `Beginning test with environment: ${environment} and index: ${indexName}...`
  );

  const pinecone = new Pinecone({ apiKey, environment });

  console.info(`Attempting to create ${indexName}...`);
  await pinecone.createIndex({
    name: indexName,
    dimension,
    metric,
    waitUntilReady: true,
    suppressConflicts: true,
  });

  console.info(`Index ${indexName} created!`);
  const indexDescription = await pinecone.describeIndex(indexName);
  console.info(`Index description: ${JSON.stringify(indexDescription)}`);

  console.info(`Beginning to upsert vectors to ${indexName}...`);
  const batchSize = 10;
  const numOfBatches = Math.floor(numRecordsToUpsert / batchSize);
  const index = pinecone.index(indexName);

  for (let i = 0; i < numOfBatches; i++) {
    const records = [];

    for (let j = 0; j < batchSize; j++) {
      records.push({
        id: randomString(10),
        values: randomEmbeddingValues(dimension),
      });
    }
    await index.upsert(records);
  }

  console.info(`Upserted ${numRecordsToUpsert} vectors to ${indexName}!`);
  console.info('Test query...');
  await pinecone
    .index(indexName)
    .query({ vector: randomEmbeddingValues(dimension), topK: 10 });
  console.info('Done querying');
})();
