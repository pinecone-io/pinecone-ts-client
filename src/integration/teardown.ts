import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

export const teardown = async () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variables: PINECONE_API_KEY or PINECONE_ENVIRONMENT');
  }
  const pc = new Pinecone({ apiKey: apiKey });
  await pc.deleteIndex(serverlessIndexName);
};
