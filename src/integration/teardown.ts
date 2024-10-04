import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

export const teardown = async () => {
  const pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });

  const indexes = await pc.listIndexes();
  if (
    indexes &&
    indexes.indexes?.some((index) => index.name != serverlessIndexName)
  ) {
    console.log('Index already exists, not recreating');
    return;
  }

  await pc.deleteIndex(serverlessIndexName);
};

teardown();
