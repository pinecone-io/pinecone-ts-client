import { Pinecone } from '../pinecone';

export const teardown = async () => {
  const pc = new Pinecone();

  const serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
  const podIndexName = process.env.POD_INDEX_NAME;

  // todo: remove non-null assertions
  await pc.deleteIndex(serverlessIndexName!);
  await pc.deleteIndex(podIndexName!);
};
