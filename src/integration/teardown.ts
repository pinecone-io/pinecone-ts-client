import { Pinecone } from '../pinecone';

export const teardown = async () => {
  let apiKey: string;

  if (process.env['PINECONE_API_KEY'] === undefined) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  } else {
    apiKey = process.env['PINECONE_API_KEY'];
  }
  const pc = new Pinecone({ apiKey: apiKey });

  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  } else {
    const serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;

    const indexes = await pc.listIndexes();
    if (
      indexes &&
      indexes.indexes?.some((index) => index.name != serverlessIndexName)
    ) {
      return;
    }

    await pc.deleteIndex(serverlessIndexName);
  }

  if (!process.env.ASSISTANT_NAME) {
    throw new Error('ASSISTANT_NAME environment variable is not set');
  } else {
    const assistantName = process.env.ASSISTANT_NAME;
    await pc.deleteAssistant(assistantName);
  }
};

teardown();
