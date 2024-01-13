import { Pinecone } from '@pinecone-database/pinecone';

function readEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

(async () => {
  const apiKey = readEnvVar('PINECONE_API_KEY');
  const indexName = readEnvVar('INDEX_NAME');

  console.info(`Beginning test with ${indexName}...`);

  const pinecone = new Pinecone({ apiKey });

  console.info(`Checking if index ${indexName} exists...`);
  const indexList = await pinecone.listIndexes();

  if (
    !indexList.indexes.some(
      (index: { name: string }) => index.name === indexName
    )
  ) {
    throw new Error(`Index ${indexName} does not exist`);
  }

  console.info(`Checking index description...`);
  const description = await pinecone.describeIndex(indexName);
  console.info(`Index description: ${JSON.stringify(description)}`);

  console.info(`Describing index stats...`);
  const indexStats = pinecone.index(indexName).describeIndexStats();
  console.info(`Index stats: ${JSON.stringify(indexStats)}`);
})();
