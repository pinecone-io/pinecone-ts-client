import { Indexes } from '../indexes';
import { createIndex, CreateIndexOptions } from '../createIndex';
import {
  createIndexForModel,
  CreateIndexForModelOptions,
} from '../createIndexForModel';
import { describeIndex } from '../describeIndex';
import { listIndexes, IndexModel } from '../listIndexes';
import { deleteIndex } from '../deleteIndex';
import { configureIndex } from '../configureIndex';
import { indexOperationsBuilder } from '../../indexOperationsBuilder';
import { IndexHostSingleton } from '../../../data/indexHostSingleton';
import { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch/db_control';

jest.mock('../createIndex');
jest.mock('../createIndexForModel');
jest.mock('../describeIndex');
jest.mock('../listIndexes');
jest.mock('../deleteIndex');
jest.mock('../configureIndex');
jest.mock('../../indexOperationsBuilder');

const model = (name: string, privateHost?: string): IndexModel => ({
  name,
  host: `${name}.example`,
  privateHost,
  status: { ready: true, state: 'Ready' },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-east-1' },
  schema: { fields: {} },
  deletionProtection: 'disabled',
});

describe('Indexes facade and host cache', () => {
  const config = { apiKey: 'key' };
  const api = {} as ManageIndexesApi;
  let indexes: Indexes;
  beforeEach(() => {
    jest.resetAllMocks();
    IndexHostSingleton._reset();
    jest.mocked(indexOperationsBuilder).mockReturnValue(api);
    indexes = new Indexes(config);
  });
  afterEach(() => IndexHostSingleton._reset());

  test.each([undefined, 'private.example'])(
    'describe updates the cache, preferring private host %p',
    async (privateHost) => {
      const response = model('index', privateHost);
      IndexHostSingleton._set(config, 'index', 'stale.example');
      jest.mocked(describeIndex).mockResolvedValue(response);
      await expect(indexes.describe('index')).resolves.toBe(response);
      expect(describeIndex).toHaveBeenCalledWith(api, 'index');
      await expect(
        IndexHostSingleton.getHostUrl(config, 'index'),
      ).resolves.toBe(`https://${privateHost || response.host}`);
      expect(describeIndex).toHaveBeenCalledTimes(1);
      expect(indexOperationsBuilder).toHaveBeenCalledWith(config);
    },
  );

  test('list caches every host, using private hosts where available', async () => {
    const response = {
      indexes: [model('one'), model('two', 'private.example')],
    };
    jest.mocked(listIndexes).mockResolvedValue(response);
    await expect(indexes.list()).resolves.toBe(response);
    expect(listIndexes).toHaveBeenCalledWith(api);
    await expect(IndexHostSingleton.getHostUrl(config, 'one')).resolves.toBe(
      'https://one.example',
    );
    await expect(IndexHostSingleton.getHostUrl(config, 'two')).resolves.toBe(
      'https://private.example',
    );
    expect(describeIndex).not.toHaveBeenCalled();
  });

  test.each([{}, { indexes: [] }])(
    'returns an empty list %p without touching existing cache',
    async (response) => {
      IndexHostSingleton._set(config, 'existing', 'existing.example');
      jest.mocked(listIndexes).mockResolvedValue(response);
      await expect(indexes.list()).resolves.toBe(response);
      await expect(
        IndexHostSingleton.getHostUrl(config, 'existing'),
      ).resolves.toBe('https://existing.example');
      expect(describeIndex).not.toHaveBeenCalled();
    },
  );

  describe.each(['create', 'createForModel'] as const)('%s', (method) => {
    const options =
      method === 'create'
        ? {
            name: 'index',
            schema: {
              fields: {
                vector: {
                  type: 'dense_vector' as const,
                  dimension: 3,
                  metric: 'cosine' as const,
                },
              },
            },
          }
        : {
            name: 'index',
            cloud: 'aws',
            region: 'us-east-1',
            embed: { model: 'model', fieldMap: { text: 'text' } },
          };
    const invoke = () =>
      method === 'create'
        ? indexes.create(options as CreateIndexOptions)
        : indexes.createForModel(options as CreateIndexForModelOptions);
    const operation =
      method === 'create'
        ? jest.mocked(createIndex)
        : jest.mocked(createIndexForModel);
    test.each([undefined, 'private.example'])(
      'returns the model and caches host %p',
      async (privateHost) => {
        const response = model('index', privateHost);
        operation.mockResolvedValue(response);
        await expect(invoke()).resolves.toBe(response);
        expect(operation).toHaveBeenCalledWith(api, options);
        await expect(
          IndexHostSingleton.getHostUrl(config, 'index'),
        ).resolves.toBe(`https://${privateHost || response.host}`);
        expect(describeIndex).not.toHaveBeenCalled();
      },
    );
    test('caches the returned name rather than the requested name', async () => {
      operation.mockResolvedValue(model('canonical-name'));
      await invoke();
      await expect(
        IndexHostSingleton.getHostUrl(config, 'canonical-name'),
      ).resolves.toBe('https://canonical-name.example');
      expect(describeIndex).not.toHaveBeenCalled();
    });
    test('does not overwrite an existing cache entry for a suppressed conflict', async () => {
      IndexHostSingleton._set(config, 'index', 'existing.example');
      operation.mockResolvedValue(undefined);
      await expect(invoke()).resolves.toBeUndefined();
      await expect(
        IndexHostSingleton.getHostUrl(config, 'index'),
      ).resolves.toBe('https://existing.example');
      expect(describeIndex).not.toHaveBeenCalled();
    });
  });

  test('successful delete invalidates only this API key and index', async () => {
    const otherConfig = { apiKey: 'other-key' };
    IndexHostSingleton._set(config, 'index', 'old.example');
    IndexHostSingleton._set(config, 'other', 'other.example');
    IndexHostSingleton._set(otherConfig, 'index', 'other-key.example');
    jest.mocked(describeIndex).mockResolvedValue(model('index'));
    await expect(indexes.delete('index')).resolves.toBeUndefined();
    expect(deleteIndex).toHaveBeenCalledWith(api, 'index');
    await expect(IndexHostSingleton.getHostUrl(config, 'index')).resolves.toBe(
      'https://index.example',
    );
    expect(describeIndex).toHaveBeenCalledTimes(1);
    await expect(IndexHostSingleton.getHostUrl(config, 'other')).resolves.toBe(
      'https://other.example',
    );
    await expect(
      IndexHostSingleton.getHostUrl(otherConfig, 'index'),
    ).resolves.toBe('https://other-key.example');
    expect(describeIndex).toHaveBeenCalledTimes(1);
  });

  test('failed delete retains the cached host and preserves the error', async () => {
    const error = new Error('deletion protection enabled');
    IndexHostSingleton._set(config, 'index', 'existing.example');
    jest.mocked(deleteIndex).mockRejectedValue(error);
    await expect(indexes.delete('index')).rejects.toBe(error);
    await expect(IndexHostSingleton.getHostUrl(config, 'index')).resolves.toBe(
      'https://existing.example',
    );
    expect(describeIndex).not.toHaveBeenCalled();
  });
  test('configure forwards its arguments and response', async () => {
    const options = { tags: { owner: 'search' } };
    const response = model('index');
    jest.mocked(configureIndex).mockResolvedValue(response);
    await expect(indexes.configure('index', options)).resolves.toBe(response);
    expect(configureIndex).toHaveBeenCalledWith(api, 'index', options);
  });
});
