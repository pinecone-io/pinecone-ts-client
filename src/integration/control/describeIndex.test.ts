import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { getTestContext } from '../test-context';

let pinecone: Pinecone, serverlessIndexName: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  serverlessIndexName = fixtures.serverlessIndex.name;
});

describe('describe index; serverless', () => {
  test('describe index, happy path', async () => {
    const description = await pinecone.indexes.describe(serverlessIndexName);
    expect(description.name).toEqual(serverlessIndexName);
    expect(description.host).toBeDefined();

    // `dimension` and `metric` are properties of the index's `dense_vector`
    // schema field rather than of the index itself.
    const embedding = description.schema.fields['embedding'];
    if (!('type' in embedding) || embedding.type !== 'dense_vector') {
      throw new Error('expected `embedding` to be a dense_vector field');
    }
    expect(embedding.dimension).toEqual(2);
    expect(embedding.metric).toEqual('dotproduct');

    // `deployment` is a discriminated union keyed on `deploymentType`.
    const deployment = description.deployment;
    if (deployment.deploymentType !== 'managed') {
      throw new Error('expected a managed (serverless) deployment');
    }
    expect(deployment.cloud).toEqual('aws');
    expect(deployment.region).toEqual('us-west-2');

    expect(description.status.ready).toEqual(true);
    expect(description.status.state).toEqual('Ready');
    expect(description.tags).toEqual({
      project: 'pinecone-integration-tests',
    });
  });
});

test('describe index with invalid index name', async () => {
  expect.assertions(1);
  try {
    return await pinecone.indexes.describe('non-existent-index');
  } catch (e) {
    const err = e as PineconeNotFoundError;
    expect(err.name).toEqual('PineconeNotFoundError');
  }
});
