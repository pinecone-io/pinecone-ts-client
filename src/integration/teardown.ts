import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

export const teardown = async () => {
  let apiKey: string;

  if (process.env['PINECONE_API_KEY'] === undefined) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  } else {
    apiKey = process.env['PINECONE_API_KEY'];
  }

  const pc = new Pinecone({ apiKey: apiKey });

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
