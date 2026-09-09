import type { IndexModelData as IndexModel } from '../listIndexes';
import {
  configureIndex,
  ConfigureIndexResourceOptions,
} from '../configureIndex';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeArgumentError,
  PineconeBadRequestError,
  PineconeConnectionError,
} from '../../../errors';

describe('configureIndex', () => {
  const request = jest.fn();
  const api = { configureIndex: request } as unknown as ManageIndexesApi;
  beforeEach(() => request.mockReset());

  test.each([
    undefined,
    null,
    {},
    { tags: undefined },
    {
      deployment: undefined,
      schema: undefined,
      readCapacity: undefined,
      tags: undefined,
      deletionProtection: undefined,
    },
  ])('rejects an absent supported option: %p', async (options) => {
    await expect(
      configureIndex(api, 'index', options as ConfigureIndexResourceOptions),
    ).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass at least one configuration option to configureIndex.',
      ),
    );
    expect(request).not.toHaveBeenCalled();
  });

  test('rejects an empty index name before making a request', async () => {
    await expect(configureIndex(api, '', { tags: {} })).rejects.toThrow(
      'non-empty string',
    );
    expect(request).not.toHaveBeenCalled();
  });

  const patches: ConfigureIndexResourceOptions[] = [
    { deployment: { replicas: 2, podType: 'p1.x2' } },
    {
      schema: {
        fields: {
          text: {
            type: 'semantic_text',
            model: 'model',
            writeParameters: { truncate: 'END' },
            readParameters: { input_type: 'query' },
          },
        },
      },
    },
    { readCapacity: { mode: 'OnDemand' } },
    {
      readCapacity: {
        mode: 'Dedicated',
        dedicated: {
          nodeType: 'b1',
          scaling: 'Manual',
          manual: { replicas: 2, shards: 1 },
        },
      },
    },
    { tags: { owner: 'search', obsolete: '' } },
    { tags: {} },
    { tags: null },
    { deletionProtection: 'disabled' },
    { deletionProtection: 'enabled', tags: { team: 'search' } },
  ];
  test.each(patches)(
    'forwards patch %p and returns the API response',
    async (options) => {
      const response: IndexModel = {
        name: 'index',
        host: 'index.example',
        status: { ready: true, state: 'Ready' },
        deployment: {
          deploymentType: 'managed',
          cloud: 'aws',
          region: 'us-east-1',
        },
        schema: { fields: {} },
        deletionProtection: 'disabled',
      };
      request.mockResolvedValue(response);
      await expect(configureIndex(api, 'index', options)).resolves.toBe(
        response,
      );
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith({
        indexName: 'index',
        configureIndexRequest: options,
        xPineconeApiVersion: '2026-07',
      });
    },
  );

  test('maps response errors with index context', async () => {
    request.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ message: 'invalid patch' }), {
          status: 400,
        }),
      ),
    );
    await expect(configureIndex(api, 'index', { tags: {} })).rejects.toThrow(
      new PineconeBadRequestError({
        status: 400,
        message: 'Error configuring index index: invalid patch',
      }),
    );
  });
  test('wraps network errors', async () => {
    request.mockRejectedValue(new Error('offline'));
    await expect(configureIndex(api, 'index', { tags: {} })).rejects.toThrow(
      PineconeConnectionError,
    );
  });
});
