import { Pinecone } from '../pinecone';
import { PineconeArgumentError } from '../errors';
import { IndexHostSingleton } from '../data/indexHostSingleton';

interface DelegateCase {
  name: string;
  spy: (client: Pinecone) => jest.SpyInstance;
  invoke: (client: Pinecone) => unknown;
  args: unknown[];
}

const createOptions: Parameters<Pinecone['createIndex']>[0] = {
  name: 'index',
  schema: { fields: { text: { type: 'string', fullTextSearch: {} } } },
};
const modelOptions = {
  name: 'index',
  cloud: 'aws',
  region: 'us-east-1',
  embed: { model: 'model', fieldMap: { text: 'text' } },
};
const collectionOptions = { name: 'collection', source: 'index' };
const backupOptions = { name: 'backup', description: 'weekly' };
const restoreOptions = { name: 'restored' };
const assistantOptions = { name: 'assistant' };
const updateOptions = { name: 'assistant', instructions: 'Be helpful' };
const evaluationOptions = { question: 'Q', answer: 'A', groundTruth: 'A' };
const pagination = { limit: 3, paginationToken: 'next-page' };

const delegates: DelegateCase[] = [
  {
    name: 'createIndex',
    spy: (p) => jest.spyOn(p.indexes, 'create'),
    invoke: (p) => p.createIndex(createOptions),
    args: [createOptions],
  },
  {
    name: 'createIndexForModel',
    spy: (p) => jest.spyOn(p.indexes, 'createForModel'),
    invoke: (p) => p.createIndexForModel(modelOptions),
    args: [modelOptions],
  },
  {
    name: 'describeIndex',
    spy: (p) => jest.spyOn(p.indexes, 'describe'),
    invoke: (p) => p.describeIndex('index'),
    args: ['index'],
  },
  {
    name: 'listIndexes',
    spy: (p) => jest.spyOn(p.indexes, 'list'),
    invoke: (p) => p.listIndexes(),
    args: [],
  },
  {
    name: 'deleteIndex',
    spy: (p) => jest.spyOn(p.indexes, 'delete'),
    invoke: (p) => p.deleteIndex('index'),
    args: ['index'],
  },
  {
    name: 'configureIndex',
    spy: (p) => jest.spyOn(p.indexes, 'configure'),
    invoke: (p) =>
      p.configureIndex({
        name: 'index',
        deletionProtection: 'enabled',
        tags: { owner: 'test' },
      }),
    args: ['index', { deletionProtection: 'enabled', tags: { owner: 'test' } }],
  },
  {
    name: 'createCollection',
    spy: (p) => jest.spyOn(p.collections, 'create'),
    invoke: (p) => p.createCollection(collectionOptions),
    args: [collectionOptions],
  },
  {
    name: 'listCollections',
    spy: (p) => jest.spyOn(p.collections, 'list'),
    invoke: (p) => p.listCollections(),
    args: [],
  },
  {
    name: 'describeCollection',
    spy: (p) => jest.spyOn(p.collections, 'describe'),
    invoke: (p) => p.describeCollection('collection'),
    args: ['collection'],
  },
  {
    name: 'deleteCollection',
    spy: (p) => jest.spyOn(p.collections, 'delete'),
    invoke: (p) => p.deleteCollection('collection'),
    args: ['collection'],
  },
  {
    name: 'createBackup',
    spy: (p) => jest.spyOn(p.backups, 'create'),
    invoke: (p) => p.createBackup({ indexName: 'index', ...backupOptions }),
    args: ['index', backupOptions],
  },
  {
    name: 'describeBackup',
    spy: (p) => jest.spyOn(p.backups, 'describe'),
    invoke: (p) => p.describeBackup('backup-id'),
    args: ['backup-id'],
  },
  {
    name: 'listBackups',
    spy: (p) => jest.spyOn(p.backups, 'list'),
    invoke: (p) => p.listBackups(pagination),
    args: [pagination],
  },
  {
    name: 'deleteBackup',
    spy: (p) => jest.spyOn(p.backups, 'delete'),
    invoke: (p) => p.deleteBackup('backup-id'),
    args: ['backup-id'],
  },
  {
    name: 'createIndexFromBackup',
    spy: (p) => jest.spyOn(p.backups, 'createIndex'),
    invoke: (p) =>
      p.createIndexFromBackup({ backupId: 'backup-id', ...restoreOptions }),
    args: ['backup-id', restoreOptions],
  },
  {
    name: 'describeRestoreJob',
    spy: (p) => jest.spyOn(p.restoreJobs, 'describe'),
    invoke: (p) => p.describeRestoreJob('restore-id'),
    args: ['restore-id'],
  },
  {
    name: 'listRestoreJobs',
    spy: (p) => jest.spyOn(p.restoreJobs, 'list'),
    invoke: (p) => p.listRestoreJobs(pagination),
    args: [pagination],
  },
  {
    name: 'createAssistant',
    spy: (p) => jest.spyOn(p.assistants, 'create'),
    invoke: (p) => p.createAssistant(assistantOptions),
    args: [assistantOptions],
  },
  {
    name: 'describeAssistant',
    spy: (p) => jest.spyOn(p.assistants, 'describe'),
    invoke: (p) => p.describeAssistant('assistant'),
    args: ['assistant'],
  },
  {
    name: 'listAssistants',
    spy: (p) => jest.spyOn(p.assistants, 'list'),
    invoke: (p) => p.listAssistants(),
    args: [],
  },
  {
    name: 'deleteAssistant',
    spy: (p) => jest.spyOn(p.assistants, 'delete'),
    invoke: (p) => p.deleteAssistant('assistant'),
    args: ['assistant'],
  },
  {
    name: 'updateAssistant',
    spy: (p) => jest.spyOn(p.assistants, 'update'),
    invoke: (p) => p.updateAssistant(updateOptions),
    args: [updateOptions],
  },
  {
    name: 'evaluate',
    spy: (p) => jest.spyOn(p.assistants, 'evaluate'),
    invoke: (p) => p.evaluate(evaluationOptions),
    args: [evaluationOptions],
  },
];

describe('deprecated flat control-plane methods', () => {
  let client: Pinecone;

  beforeEach(() => {
    client = new Pinecone({ apiKey: 'legacy-test-key' });
    IndexHostSingleton._reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    IndexHostSingleton._reset();
  });

  describe.each(delegates)('$name', ({ spy, invoke, args }) => {
    test('forwards arguments and returns the resource promise unchanged', async () => {
      const result = { sentinel: 'resource response' };
      const promise = Promise.resolve(result);
      const delegate = spy(client).mockReturnValue(promise);
      const actual = invoke(client);
      expect(actual).toBe(promise);
      await expect(actual).resolves.toBe(result);
      expect(delegate).toHaveBeenCalledTimes(1);
      expect(delegate).toHaveBeenCalledWith(...args);
    });

    test('preserves the resource rejection', async () => {
      const error = new PineconeArgumentError('resource validation failed');
      const promise = Promise.reject(error);
      spy(client).mockReturnValue(promise);
      const actual = invoke(client);
      expect(actual).toBe(promise);
      await expect(actual).rejects.toBe(error);
    });
  });

  test('configureIndex removes name without mutating the caller options', () => {
    const options = Object.freeze({ name: 'index', tags: { owner: 'test' } });
    const configure = jest
      .spyOn(client.indexes, 'configure')
      .mockResolvedValue(undefined as never);
    client.configureIndex(options);
    expect(configure).toHaveBeenCalledWith('index', { tags: options.tags });
    expect(options.name).toBe('index');
  });

  test.each([undefined, ''])(
    'configureIndex rejects missing or empty name (%s)',
    async (name) => {
      const operation = client.configureIndex({ name } as Parameters<
        Pinecone['configureIndex']
      >[0]);
      await expect(operation).rejects.toBeInstanceOf(PineconeArgumentError);
      await expect(operation).rejects.toThrow('`name`');
    },
  );

  test('optional arguments stay optional for backups and restore jobs', () => {
    const create = jest
      .spyOn(client.backups, 'create')
      .mockResolvedValue(undefined as never);
    const list = jest
      .spyOn(client.restoreJobs, 'list')
      .mockResolvedValue({ data: [] });
    client.createBackup({ indexName: 'index' });
    client.listRestoreJobs();
    expect(create).toHaveBeenCalledWith('index', {});
    expect(list).toHaveBeenCalledWith(undefined);
  });

  test('backup shims extract resource identifiers without mutating options', () => {
    const createOptions = Object.freeze({
      indexName: 'index',
      ...backupOptions,
    });
    const restoreOptions = Object.freeze({
      backupId: 'backup-id',
      name: 'restored',
      tags: { owner: 'test' },
    });
    const create = jest
      .spyOn(client.backups, 'create')
      .mockResolvedValue(undefined as never);
    const restore = jest
      .spyOn(client.backups, 'createIndex')
      .mockResolvedValue(undefined as never);
    client.createBackup(createOptions);
    client.createIndexFromBackup(restoreOptions);
    expect(create).toHaveBeenCalledWith('index', backupOptions);
    expect(restore).toHaveBeenCalledWith('backup-id', {
      name: 'restored',
      tags: restoreOptions.tags,
    });
    expect(createOptions.indexName).toBe('index');
    expect(restoreOptions.backupId).toBe('backup-id');
  });

  test('listBackups supports an index name without pagination', () => {
    const listByIndex = jest
      .spyOn(client.backups, 'listByIndex')
      .mockResolvedValue({});
    client.listBackups({ indexName: 'index' });
    expect(listByIndex.mock.calls).toStrictEqual([
      ['index', { includeDeleted: undefined }],
    ]);
  });

  test.each([undefined, {}, { indexName: '' }, { includeDeleted: true }])(
    'listBackups lists the project for %j',
    (options) => {
      const list = jest.spyOn(client.backups, 'list').mockResolvedValue({});
      const listByIndex = jest.spyOn(client.backups, 'listByIndex');
      client.listBackups(options);
      expect(list.mock.calls).toStrictEqual([[{}]]);
      expect(listByIndex).not.toHaveBeenCalled();
    },
  );

  test('listBackups routes index pagination and includeDeleted without mutating options', async () => {
    const options = Object.freeze({
      indexName: 'index',
      ...pagination,
      includeDeleted: true,
    });
    const promise = Promise.resolve({ data: [] });
    const listByIndex = jest
      .spyOn(client.backups, 'listByIndex')
      .mockReturnValue(promise);
    const list = jest.spyOn(client.backups, 'list');
    expect(client.listBackups(options)).toBe(promise);
    await promise;
    expect(listByIndex).toHaveBeenCalledWith('index', {
      ...pagination,
      includeDeleted: true,
    });
    expect(list).not.toHaveBeenCalled();
    expect(options.indexName).toBe('index');
  });

  test.each([undefined, 'private.pinecone.io'])(
    'describeIndex populates the real cache with privateHost=%s',
    async (privateHost) => {
      const fetchApi = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: 'index',
            host: 'public.pinecone.io',
            private_host: privateHost,
            schema: { fields: {} },
            status: { ready: true, state: 'Ready' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      const config = { apiKey: 'cache-test-key', fetchApi };
      const pc = new Pinecone(config);
      const result = await pc.describeIndex('index');
      expect(result.host).toBe('public.pinecone.io');
      expect(await IndexHostSingleton.getHostUrl(config, 'index')).toBe(
        `https://${privateHost || 'public.pinecone.io'}`,
      );
      expect(fetchApi).toHaveBeenCalledTimes(1);
    },
  );
});
