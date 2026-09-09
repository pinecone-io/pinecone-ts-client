import { decorateIndexModel } from '../decorateIndexModel';
import { fixtures } from './fixtures/indexModels';
import { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch/db_control';
import { describeIndex } from '../describeIndex';
import { createIndex } from '../createIndex';
import { createIndexForModel } from '../createIndexForModel';
import { configureIndex } from '../configureIndex';
import { listIndexes } from '../listIndexes';
import { PineconeIndexPropertyError } from '../../../errors';

const createOptions = {
  name: 'test-index',
  schema: {
    fields: {
      _values: {
        type: 'dense_vector' as const,
        dimension: 1536,
        metric: 'cosine' as const,
      },
    },
  },
  deployment: {
    deploymentType: 'managed' as const,
    cloud: 'aws',
    region: 'us-east-1',
  },
};
const modelOptions = {
  name: 'test-index',
  cloud: 'aws',
  region: 'us-east-1',
  embed: { model: 'multilingual-e5-large', fieldMap: { text: 'chunk_text' } },
};

describe('legacy accessors on every index response path', () => {
  let api: ManageIndexesApi;
  beforeEach(() => {
    api = new ManageIndexesApi();
    jest
      .spyOn(api, 'describeIndex')
      .mockImplementation(async () => structuredClone(fixtures.classicDense));
    jest
      .spyOn(api, 'createIndex')
      .mockImplementation(async () => structuredClone(fixtures.classicDense));
    jest
      .spyOn(api, 'createIndexForModel')
      .mockImplementation(async () => structuredClone(fixtures.classicDense));
    jest
      .spyOn(api, 'configureIndex')
      .mockImplementation(async () => structuredClone(fixtures.classicDense));
  });
  test.each([
    ['describe', () => describeIndex(api, 'test-index')],
    ['create', () => createIndex(api, createOptions)],
    [
      'create and wait',
      () => createIndex(api, { ...createOptions, waitUntilReady: true }),
    ],
    ['create for model', () => createIndexForModel(api, modelOptions)],
    [
      'create for model and wait',
      () => createIndexForModel(api, { ...modelOptions, waitUntilReady: true }),
    ],
    [
      'configure',
      () =>
        configureIndex(api, 'test-index', { deletionProtection: 'enabled' }),
    ],
  ] as const)('%s exposes a derived dimension', async (_, operation) => {
    expect((await operation()).dimension).toBe(1536);
  });
  test('list decorates each index independently', async () => {
    jest.spyOn(api, 'listIndexes').mockResolvedValue({
      indexes: [
        structuredClone(fixtures.classicDense),
        structuredClone(fixtures.fullTextOnly),
        structuredClone(fixtures.namedDense),
      ],
    });
    const indexes = (await listIndexes(api)).indexes!;
    expect(indexes[0].dimension).toBe(1536);
    expect(() => indexes[1].dimension).toThrow(PineconeIndexPropertyError);
    expect(indexes[2].dimension).toBe(768);
  });
  test('decoration is idempotent and getters reflect later schema updates', () => {
    const model = decorateIndexModel(structuredClone(fixtures.classicDense));
    expect(decorateIndexModel(model)).toBe(model);
    model.schema.fields._values = {
      type: 'dense_vector',
      dimension: 8,
      metric: 'euclidean',
    };
    expect(model.dimension).toBe(8);
    expect(model.metric).toBe('euclidean');
  });
  test('read capacity absence refuses only the nested capacity read', () => {
    const model = decorateIndexModel(
      structuredClone(fixtures.managedMissingReadCapacity),
    );
    expect(model.spec.serverless?.cloud).toBe('aws');
    expect(model.spec.serverless?.region).toBe('us-east-1');
    expect(() => model.spec.serverless?.readCapacity).toThrow(
      PineconeIndexPropertyError,
    );
    try {
      void model.spec.serverless?.readCapacity;
    } catch (error) {
      expect(error).toMatchObject({
        property: 'spec.serverless.readCapacity',
        reason: 'unproducible-response',
        indexName: 'test-index',
      });
    }
    expect(() => JSON.stringify(model.spec)).not.toThrow();
    const pod = decorateIndexModel(structuredClone(fixtures.podPartial));
    expect(pod.spec.pod?.pods).toBeUndefined();
    expect(pod.spec.serverless).toBeUndefined();
  });
  test('read capacity preserves API values and identity, without schema name collision', () => {
    const model = decorateIndexModel(structuredClone(fixtures.classicDense));
    expect(model.spec.serverless?.readCapacity).toBe(model.readCapacity);
    expect(model.spec.serverless?.schema).toBeUndefined();
  });
});
