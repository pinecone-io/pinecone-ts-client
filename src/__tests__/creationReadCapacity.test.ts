import { Pinecone, CreateIndexForModelOptions } from '../index';
import { PineconeArgumentError } from '../errors';

const dedicated = {
  mode: 'Dedicated',
  dedicated: {
    node_type: 'b1',
    scaling: 'Manual',
    manual: { replicas: 1, shards: 2 },
  },
};
const flat = { nodeType: 'b1', manual: { replicas: 1, shards: 2 } };
const native = {
  mode: 'Dedicated',
  dedicated: {
    nodeType: 'b1',
    scaling: 'Manual',
    manual: { replicas: 1, shards: 2 },
  },
};
const model = {
  name: 'compat',
  cloud: 'aws',
  region: 'us-east-1',
  embed: { model: 'multilingual-e5-large', fieldMap: { text: 'text' } },
};

describe.each([
  'flat model',
  'resource model',
  'flat backup',
  'resource backup',
])('%s read capacity', (operation) => {
  const setup = () => {
    const fetchApi = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'compat',
          schema: { fields: {} },
          deployment: {
            deployment_type: 'managed',
            cloud: 'aws',
            region: 'us-east-1',
          },
          status: { ready: true, state: 'Ready' },
          host: 'example.test',
          deletion_protection: 'disabled',
          restore_job_id: 'job',
          index_id: 'idx',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const pc = new Pinecone({ apiKey: 'placeholder', fetchApi });
    const call = (capacity: unknown) => {
      const readCapacity =
        capacity as CreateIndexForModelOptions['readCapacity'];
      const options = operation.includes('model')
        ? { ...model, readCapacity }
        : { name: 'compat', readCapacity };
      const original = structuredClone(options);
      const request =
        operation === 'flat model'
          ? pc.createIndexForModel(options as CreateIndexForModelOptions)
          : operation === 'resource model'
            ? pc.indexes.createForModel(options as CreateIndexForModelOptions)
            : operation === 'flat backup'
              ? pc.createIndexFromBackup({ backupId: 'backup', ...options })
              : pc.backups.createIndex('backup', options);
      return request.finally(() => expect(options).toEqual(original));
    };
    return { call, fetchApi };
  };
  test.each([
    [undefined, undefined],
    [{}, { mode: 'OnDemand' }],
    [{ mode: 'OnDemand' }, { mode: 'OnDemand' }],
    [flat, dedicated],
    [{ ...flat, mode: 'Dedicated' }, dedicated],
    [native, dedicated],
    [
      {
        ...native,
        dedicated: {
          ...native.dedicated,
          nodeType: 'future-node',
          scaling: 'FutureScaling',
        },
      },
      {
        ...dedicated,
        dedicated: {
          ...dedicated.dedicated,
          node_type: 'future-node',
          scaling: 'FutureScaling',
        },
      },
    ],
  ])(
    'serializes %p exactly without mutating input',
    async (input, expected) => {
      const { call, fetchApi } = setup();
      await call(input);
      expect(fetchApi).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchApi.mock.calls[0][1].body);
      const base = operation.includes('model')
        ? {
            name: 'compat',
            cloud: 'aws',
            region: 'us-east-1',
            embed: {
              model: 'multilingual-e5-large',
              field_map: { text: 'text' },
            },
          }
        : { name: 'compat' };
      expect(body).toEqual({
        ...base,
        ...(expected ? { read_capacity: expected } : {}),
      });
    },
  );
  test.each([
    [null, 'object for `readCapacity`'],
    [{ mode: 'invalid' }, 'readCapacity.mode must be'],
    [{ ...flat, mode: 'OnDemand' }, 'require mode Dedicated'],
    [{ ...flat, nodeType: 'invalid' }, 'readCapacity.nodeType'],
    [{ nodeType: 'b1' }, 'readCapacity.manual'],
    [{ ...flat, manual: { replicas: -1, shards: 2 } }, 'readCapacity.manual'],
    [{ ...flat, manual: { replicas: 1, shards: 0 } }, 'readCapacity.manual'],
    [{ ...flat, dedicated: {} }, 'Unknown option(s)'],
  ])('rejects %p locally', async (input, message) => {
    const { call, fetchApi } = setup();
    await expect(call(input)).rejects.toThrow(PineconeArgumentError);
    expect(fetchApi).not.toHaveBeenCalled();
    await expect(call(input)).rejects.toThrow(message as string);
  });
});
