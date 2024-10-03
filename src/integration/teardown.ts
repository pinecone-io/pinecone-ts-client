import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

export const teardown = async (apiKey: string) => {
  const pc = new Pinecone({ apiKey: apiKey });
  await pc.deleteIndex(serverlessIndexName);
};
