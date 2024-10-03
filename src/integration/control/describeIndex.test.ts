import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { serverlessIndexName } from '../test-helpers';

let pinecone: Pinecone;

beforeAll(() => {
  pinecone = new Pinecone();
});

describe('describe index; serverless', () => {
  test('describe index, happy path', async () => {
    const description = await pinecone.describeIndex(serverlessIndexName);
    expect(description.name).toEqual(serverlessIndexName);
    expect(description.dimension).toEqual(2);
    expect(description.metric).toEqual('dotproduct');
    expect(description.host).toBeDefined();
    expect(description.spec.serverless).toBeDefined();
    expect(description.spec.serverless?.cloud).toEqual('aws');
    expect(description.spec.serverless?.region).toEqual('us-west-2');
    expect(description.status.ready).toEqual(true);
    expect(description.status.state).toEqual('Ready');
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
