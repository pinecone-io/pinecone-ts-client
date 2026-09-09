import {
  createIndexForModel,
  CreateIndexForModelOptions,
} from '../createIndexForModel';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import type { IndexModel } from '../listIndexes';
import {
  PineconeArgumentError,
  PineconeConflictError,
  PineconeConnectionError,
  PineconeBadRequestError,
  PineconeTimeoutError,
  PineconeIndexInitializationFailedError,
  PineconeIndexTerminatedError,
} from '../../../errors';

const options: CreateIndexForModelOptions = {
  name: 'test-index',
  cloud: 'aws',
  region: 'us-east-1',
  embed: {
    model: 'multilingual-e5-large',
    fieldMap: { text: 'chunk_text' },
    metric: 'cosine',
    dimension: 1024,
    readParameters: { input_type: 'query' },
    writeParameters: { input_type: 'passage' },
  },
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
      chunk_text: {
        type: 'semantic_text',
        model: 'multilingual-e5-large',
        dimension: 1024,
        metric: 'cosine',
      },
    },
  },
  deletionProtection: 'enabled',
  status: { ready: false, state: 'Initializing' },
};

describe('createIndexForModel', () => {
  let api: ManageIndexesApi;
  let create: jest.SpyInstance;
  let describeIndex: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    api = new ManageIndexesApi();
    create = jest.spyOn(api, 'createIndexForModel').mockResolvedValue(created);
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
    await expect(createIndexForModel(api, input)).resolves.toBe(created);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      createIndexForModelRequest: options,
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
    const result = createIndexForModel(api, {
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
      createIndexForModelRequest: options,
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
      createIndexForModel(api, { ...options, waitUntilReady: true }),
    ).rejects.toBeInstanceOf(errorClass);
    expect(describeIndex).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('preserves a readiness timeout and stops describing at the deadline', async () => {
    describeIndex.mockResolvedValue(created);
    const result = createIndexForModel(api, {
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
      createIndexForModel(api, {
        ...options,
        suppressConflicts: true,
        waitUntilReady: true,
      }),
    ).resolves.toBeUndefined();
    expect(describeIndex).not.toHaveBeenCalled();
    await expect(createIndexForModel(api, options)).rejects.toBe(error);
    await expect(
      createIndexForModel(api, { ...options, suppressConflicts: false }),
    ).rejects.toBe(error);
  });

  it('does not suppress other Pinecone errors', async () => {
    const error = new PineconeBadRequestError({
      message: 'invalid schema',
      status: 400,
    });
    create.mockRejectedValue(error);
    await expect(
      createIndexForModel(api, { ...options, suppressConflicts: true }),
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
    await expect(createIndexForModel(api, options)).rejects.toMatchObject({
      name: 'PineconeBadRequestError',
      message: expect.stringContaining(
        'Error creating index for model test-index: invalid request',
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
      createIndexForModel(api, { ...options, waitUntilReady: true }),
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
      const result = createIndexForModel(api, {
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
    ['options', undefined],
    ['name', { ...options, name: '' }],
    ['cloud', { ...options, cloud: '' }],
    ['region', { ...options, region: '' }],
    ['embed', { ...options, embed: undefined }],
    ['embed.model', { ...options, embed: { ...options.embed, model: '' } }],
    [
      'embed.fieldMap missing',
      { ...options, embed: { ...options.embed, fieldMap: undefined } },
    ],
    [
      'embed.fieldMap empty',
      { ...options, embed: { ...options.embed, fieldMap: {} } },
    ],
    [
      'embed.metric',
      { ...options, embed: { ...options.embed, metric: 'manhattan' } },
    ],
  ])('rejects invalid %s before calling the API', async (field, input) => {
    await expect(
      createIndexForModel(api, input as CreateIndexForModelOptions),
    ).rejects.toEqual(
      new PineconeArgumentError(
        (
          {
            options:
              'You must pass an object with required properties (`name`, `cloud`, `region`, `embed`) to create an index for a model.',
            name: 'You must pass a non-empty string for `name` in order to create an index.',
            cloud:
              'You must pass a non-empty string for `cloud` in order to create an index.',
            region:
              'You must pass a non-empty string for `region` in order to create an index.',
            embed:
              'You must pass an `embed` object in order to create an index for a model.',
            'embed.model':
              'You must pass a non-empty string for `embed.model` in order to create an index for a model.',
            'embed.fieldMap missing':
              'You must pass a non-empty `embed.fieldMap` object in order to create an index for a model.',
            'embed.fieldMap empty':
              'You must pass a non-empty `embed.fieldMap` object in order to create an index for a model.',
            'embed.metric':
              'Invalid metric value: manhattan. Valid values are: cosine, euclidean, or dotproduct.',
          } as Record<string, string>
        )[field as string],
      ),
    );
    expect(create).not.toHaveBeenCalled();
  });
  it('uses the name returned by creation for readiness polling', async () => {
    const ready: IndexModel = {
      ...created,
      name: 'returned-index',
      status: { ready: true, state: 'Ready' },
    };
    create.mockResolvedValue({ ...created, name: 'returned-index' });
    describeIndex.mockResolvedValue(ready);
    await expect(
      createIndexForModel(api, { ...options, waitUntilReady: true }),
    ).resolves.toBe(ready);
    expect(describeIndex).toHaveBeenCalledWith({
      indexName: 'returned-index',
      xPineconeApiVersion: '2026-07',
    });
  });
  it.each([undefined, ''])(
    'uses the requested name when creation returns %s',
    async (name) => {
      const ready: IndexModel = {
        ...created,
        name: options.name,
        status: { ready: true, state: 'Ready' },
      };
      create.mockResolvedValue({ ...created, name });
      describeIndex.mockResolvedValue(ready);
      await expect(
        createIndexForModel(api, { ...options, waitUntilReady: true }),
      ).resolves.toBe(ready);
      expect(describeIndex).toHaveBeenCalledWith({
        indexName: options.name,
        xPineconeApiVersion: '2026-07',
      });
    },
  );
  it.each(['cosine', 'euclidean', 'dotproduct', undefined] as const)(
    'accepts metric %s',
    async (metric) => {
      const input = { ...options, embed: { ...options.embed, metric } };
      await expect(createIndexForModel(api, input)).resolves.toBe(created);
      expect(create).toHaveBeenCalledWith({
        createIndexForModelRequest: input,
        xPineconeApiVersion: '2026-07',
      });
    },
  );
});
