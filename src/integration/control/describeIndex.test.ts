import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';

let pinecone: Pinecone, serverlessIndexName: string;

beforeAll(() => {
  pinecone = new Pinecone();
  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  }
  serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
});

describe('describe index; serverless', () => {
  test('describe index, happy path', async () => {
    const description = await pinecone.describeIndex(serverlessIndexName);
    expect(description.name).toEqual(serverlessIndexName);
    expect(description.dimension).toEqual(2);
    expect(description.metric).toEqual('dotproduct');
    expect(description.host).toBeDefined();
    const spec = description.spec as any;
    expect(spec.serverless).toBeDefined();
    expect(spec.serverless?.cloud).toEqual('aws');
    expect(spec.serverless?.region).toEqual('us-west-2');
    expect(description.status.ready).toEqual(true);
    expect(description.status.state).toEqual('Ready');
    expect(description.tags).toEqual({
      project: 'pinecone-integration-tests-serverless',
    });
  });
});

test('describe index with invalid index name', async () => {
  expect.assertions(1);
  try {
    return await pinecone.describeIndex('non-existent-index');
  } catch (e) {
    const err = e as PineconeNotFoundError;
    expect(err.name).toEqual('PineconeNotFoundError');
  }
});
