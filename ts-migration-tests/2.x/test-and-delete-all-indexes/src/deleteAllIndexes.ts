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

  const pinecone = new Pinecone({ apiKey });
  const indexList = await pinecone.listIndexes();

  if (!indexList.indexes || indexList.indexes.length === 0) {
    throw new Error('No indexes found');
  }

  console.info(`Found ${indexList.indexes.length} indexes, deleting...`);

  for (const index of indexList.indexes) {
    console.info(`Deleting index ${index.name}...`);
    await pinecone.deleteIndex(index.name);
  }
})();
