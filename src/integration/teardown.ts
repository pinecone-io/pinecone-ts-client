import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

export const teardown = async () => {
  const pc = new Pinecone();
  await pc.deleteIndex(serverlessIndexName);
};
