import { createIndex, CreateIndexOptions } from '../createIndex';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import type { IndexModelData as IndexModel } from '../listIndexes';
import {
  PineconeArgumentError,
  PineconeConflictError,
  PineconeConnectionError,
  PineconeBadRequestError,
  PineconeTimeoutError,
  PineconeIndexInitializationFailedError,
  PineconeIndexTerminatedError,
} from '../../../errors';

const options: CreateIndexOptions = {
  name: 'test-index',
  schema: {
    fields: {
      vector: { type: 'dense_vector', dimension: 8, metric: 'cosine' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-east-1' },
  cmekId: 'key-id',
  readCapacity: { mode: 'OnDemand' },
  tags: { team: 'search' },
  deletionProtection: 'enabled',
};
const created: IndexModel = {
  name: 'test-index',
  host: 'test-index.svc.example.com',
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-east-1' },
  schema: {
    fields: {
      vector: { type: 'dense_vector', dimension: 8, metric: 'cosine' },
    },
  },
  deletionProtection: 'enabled',
  status: { ready: false, state: 'Initializing' },
};

describe('createIndex', () => {
  let api: ManageIndexesApi;
  let create: jest.SpyInstance;
  let describeIndex: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    api = new ManageIndexesApi();
    create = jest.spyOn(api, 'createIndex').mockResolvedValue(created);
    describeIndex = jest.spyOn(api, 'describeIndex');
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('forwards the complete request, strips client options, and returns the created model without polling', async () => {
    const input = {
      ...options,
      waitUntilReady: false,
      timeout: 12000,
      suppressConflicts: true,
    };
    const original = JSON.parse(JSON.stringify(input));
    await expect(createIndex(api, input)).resolves.toBe(created);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      createIndexRequest: options,
      xPineconeApiVersion: '2026-07',
    });
    expect(input).toEqual(original);
    expect(describeIndex).not.toHaveBeenCalled();
  });

  it('returns the ready describe response after polling a pending index', async () => {
    const ready: IndexModel = {
      ...created,
      host: 'ready.svc.example.com',
      status: { ready: true, state: 'Ready' },
    };
    describeIndex.mockResolvedValueOnce(created).mockResolvedValueOnce(ready);
    const result = createIndex(api, {
      ...options,
      waitUntilReady: true,
      timeout: 15000,
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(describeIndex).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(4999);
    expect(describeIndex).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe(ready);
    expect(describeIndex).toHaveBeenCalledTimes(2);
    expect(describeIndex).toHaveBeenNthCalledWith(1, {
      indexName: 'test-index',
      xPineconeApiVersion: '2026-07',
    });
    expect(describeIndex).toHaveBeenNthCalledWith(2, {
      indexName: 'test-index',
      xPineconeApiVersion: '2026-07',
    });
    expect(create).toHaveBeenCalledWith({
      createIndexRequest: options,
      xPineconeApiVersion: '2026-07',
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([
    ['InitializationFailed', PineconeIndexInitializationFailedError],
    ['Failed', PineconeIndexInitializationFailedError],
    ['Terminating', PineconeIndexTerminatedError],
    ['Disabled', PineconeIndexTerminatedError],
  ])('stops polling on terminal state %s', async (state, errorClass) => {
    describeIndex.mockResolvedValue({
      ...created,
      status: { ready: false, state },
    });
    await expect(
      createIndex(api, { ...options, waitUntilReady: true }),
    ).rejects.toBeInstanceOf(errorClass);
    expect(describeIndex).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('preserves a readiness timeout and stops describing at the deadline', async () => {
    describeIndex.mockResolvedValue(created);
    const result = createIndex(api, {
      ...options,
      waitUntilReady: true,
      timeout: 10000,
    });
    const assertion =
      expect(result).rejects.toBeInstanceOf(PineconeTimeoutError);
    await jest.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(describeIndex).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('suppresses an existing-index conflict only when requested, without polling', async () => {
    const error = new PineconeConflictError({
      message: 'already exists',
      status: 409,
    });
    create.mockRejectedValue(error);
    await expect(
      createIndex(api, {
        ...options,
        suppressConflicts: true,
        waitUntilReady: true,
      }),
    ).resolves.toBeUndefined();
    expect(describeIndex).not.toHaveBeenCalled();
    await expect(createIndex(api, options)).rejects.toBe(error);
    await expect(
      createIndex(api, { ...options, suppressConflicts: false }),
    ).rejects.toBe(error);
  });

  it('does not suppress other Pinecone errors', async () => {
    const error = new PineconeBadRequestError({
      message: 'invalid schema',
      status: 400,
    });
    create.mockRejectedValue(error);
    await expect(
      createIndex(api, { ...options, suppressConflicts: true }),
    ).rejects.toBe(error);
    expect(describeIndex).not.toHaveBeenCalled();
  });

  it('converts an HTTP error with creation context', async () => {
    create.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ message: 'invalid request' }), {
          status: 400,
        }),
      ),
    );
    await expect(createIndex(api, options)).rejects.toMatchObject({
      name: 'PineconeBadRequestError',
      message: expect.stringContaining(
        'Error creating index test-index: invalid request',
      ),
    });
  });

  it('converts an HTTP describe error with readiness context', async () => {
    describeIndex.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ message: 'describe failed' }), {
          status: 400,
        }),
      ),
    );
    await expect(
      createIndex(api, { ...options, waitUntilReady: true }),
    ).rejects.toMatchObject({
      name: 'PineconeBadRequestError',
      message:
        'Error waiting for index test-index to be ready: describe failed',
    });
    expect(describeIndex).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(['create', 'describe'])(
    'retains the cause of a network failure during %s',
    async (stage) => {
      const cause = new Error('connection reset');
      (stage === 'create' ? create : describeIndex).mockRejectedValue(cause);
      const result = createIndex(api, {
        ...options,
        waitUntilReady: true,
        suppressConflicts: true,
      });
      await expect(result).rejects.toBeInstanceOf(PineconeConnectionError);
      await expect(result).rejects.toMatchObject({ cause });
      expect(jest.getTimerCount()).toBe(0);
    },
  );
  it.each([
    ['name', { ...options, name: '' }],
    ['schema', { name: 'test-index' }],
  ])('rejects missing %s before calling the API', async (field, input) => {
    await expect(createIndex(api, input as CreateIndexOptions)).rejects.toEqual(
      new PineconeArgumentError(
        field === 'name'
          ? 'You must pass a non-empty string for `name` in order to create an index.'
          : 'You must pass a `schema` object in order to create an index.',
      ),
    );
    expect(create).not.toHaveBeenCalled();
  });
  it('leaves optional deployment and read settings to the server', async () => {
    const minimal = { name: options.name, schema: options.schema };
    await createIndex(api, minimal);
    expect(create).toHaveBeenCalledWith({
      createIndexRequest: minimal,
      xPineconeApiVersion: '2026-07',
    });
  });
});
