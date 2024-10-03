import { Pinecone } from '../pinecone';
import { serverlessIndexName } from './test-helpers';

module.exports = async function () {
  await teardown();
  return null;
};

export const teardown = async () => {
  const pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });
  await pc.deleteIndex(serverlessIndexName);
};
