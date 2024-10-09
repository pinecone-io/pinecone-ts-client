import { Pinecone } from '../pinecone';
// import { serverlessIndexName } from './test-helpers';

export const teardown = async () => {
  let apiKey: string;

  if (process.env['PINECONE_API_KEY'] === undefined) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  } else {
    apiKey = process.env['PINECONE_API_KEY'];
  }

  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  } else {
    const serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;

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
  }
};

teardown();
