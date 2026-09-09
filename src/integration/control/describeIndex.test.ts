import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { getTestContext, IntegrationFixtures } from '../test-context';

let pinecone: Pinecone, serverlessIndexName: string;
let indexFixture: IntegrationFixtures['serverlessIndex'];

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  indexFixture = fixtures.serverlessIndex;
  serverlessIndexName = fixtures.serverlessIndex.name;
});

describe('describe index; serverless', () => {
  test('describe index, happy path', async () => {
    const description = await pinecone.indexes.describe(serverlessIndexName);
    expect(description.name).toEqual(serverlessIndexName);
    expect(description.host).toBeDefined();

    // `dimension` and `metric` are properties of the index's `dense_vector`
    // schema field rather than of the index itself.
    const embedding = description.schema.fields[indexFixture.vectorFieldName];
    if (!('type' in embedding) || embedding.type !== 'dense_vector') {
      throw new Error('expected `embedding` to be a dense_vector field');
    }
    expect(embedding.dimension).toEqual(indexFixture.dimension);
    expect(embedding.metric).toEqual(indexFixture.metric);

    // `deployment` is a discriminated union keyed on `deploymentType`.
    const deployment = description.deployment;
    if (deployment.deploymentType !== 'managed') {
      throw new Error('expected a managed (serverless) deployment');
    }
    expect(deployment.cloud).toEqual(indexFixture.deployment.cloud);
    expect(deployment.region).toEqual(indexFixture.deployment.region);

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
