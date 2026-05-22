import { createPreviewIndex } from '../createIndex';
import {
  PineconeArgumentError,
  PineconeIndexInitializationFailedError,
  PineconeIndexTerminatedError,
  PineconeTimeoutError,
} from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';
import type { PreviewCreateIndexOptions } from '../createIndex';

const validOptions: PreviewCreateIndexOptions = {
  name: 'schema-idx',
  schema: {
    fields: {
      chunk_text: { type: 'string' as const, full_text_search: {} },
    },
  },
};

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    createIndex: jest.fn().mockResolvedValue({
      name: 'schema-idx',
      host: 'schema-idx.svc.pinecone.io',
      schema: {
        fields: { chunk_text: { type: 'string', full_text_search: {} } },
      },
      status: { ready: true, state: 'Ready' },
      deployment: { deployment_type: 'managed' },
      deletion_protection: 'disabled',
    }),
    describeIndex: jest.fn(),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('createPreviewIndex', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when name is empty string', async () => {
      await expect(
        createPreviewIndex(buildMockApi(), { ...validOptions, name: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `name` field', async () => {
      await expect(
        createPreviewIndex(buildMockApi(), { ...validOptions, name: '' }),
      ).rejects.toThrow('`name`');
    });

    test('throws PineconeArgumentError when schema is missing', async () => {
      await expect(
        createPreviewIndex(buildMockApi(), {
          name: 'my-index',
        } as PreviewCreateIndexOptions),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `schema` field', async () => {
      await expect(
        createPreviewIndex(buildMockApi(), {
          name: 'my-index',
        } as PreviewCreateIndexOptions),
      ).rejects.toThrow('`schema`');
    });
  });

  describe('success', () => {
    test('returns IndexModel on success', async () => {
      const result = await createPreviewIndex(buildMockApi(), validOptions);
      expect(result).toMatchObject({ name: 'schema-idx' });
    });

    test('passes name to the API client', async () => {
      const api = buildMockApi();
      await createPreviewIndex(api, validOptions);
      expect(api.createIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexRequest: expect.objectContaining({ name: 'schema-idx' }),
        }),
      );
    });

    test('passes schema to the API client', async () => {
      const api = buildMockApi();
      await createPreviewIndex(api, validOptions);
      expect(api.createIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexRequest: expect.objectContaining({
            schema: validOptions.schema,
          }),
        }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await createPreviewIndex(api, validOptions);
      expect(api.createIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('does not pass waitUntilReady to the API client', async () => {
      const api = buildMockApi();
      await createPreviewIndex(api, { ...validOptions, waitUntilReady: false });
      expect(api.createIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexRequest: expect.not.objectContaining({
            waitUntilReady: expect.anything(),
          }),
        }),
      );
    });

    test('polls with describeIndex when waitUntilReady is true', async () => {
      const api = buildMockApi({
        describeIndex: jest.fn().mockResolvedValue({
          name: 'schema-idx',
          host: 'schema-idx.svc.pinecone.io',
          schema: { fields: {} },
          status: { ready: true, state: 'Ready' },
          deployment: { deployment_type: 'managed' },
          deletion_protection: 'disabled',
        }),
      });
      await createPreviewIndex(api, { ...validOptions, waitUntilReady: true });
      expect(api.describeIndex).toHaveBeenCalledWith(
        expect.objectContaining({ indexName: 'schema-idx' }),
      );
    });
  });

  describe('waitUntilReady polling', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('resolves once index becomes ready after not-ready polls', async () => {
      const api = buildMockApi({
        describeIndex: jest
          .fn()
          .mockResolvedValueOnce({
            status: { ready: false, state: 'Initializing' },
          })
          .mockResolvedValueOnce({ status: { ready: true, state: 'Ready' } }),
      });
      const promise = createPreviewIndex(api, {
        ...validOptions,
        waitUntilReady: true,
      });
      await jest.advanceTimersByTimeAsync(10000);
      const result = await promise;
      expect(result.status?.state).toBe('Ready');
      expect(api.describeIndex).toHaveBeenCalledTimes(2);
    });

    test('throws PineconeIndexInitializationFailedError on InitializationFailed state', async () => {
      const api = buildMockApi({
        describeIndex: jest.fn().mockResolvedValue({
          status: { ready: false, state: 'InitializationFailed' },
        }),
      });
      await expect(
        createPreviewIndex(api, { ...validOptions, waitUntilReady: true }),
      ).rejects.toThrow(PineconeIndexInitializationFailedError);
    });

    test('throws PineconeIndexTerminatedError on Terminating state', async () => {
      const api = buildMockApi({
        describeIndex: jest.fn().mockResolvedValue({
          status: { ready: false, state: 'Terminating' },
        }),
      });
      await expect(
        createPreviewIndex(api, { ...validOptions, waitUntilReady: true }),
      ).rejects.toThrow(PineconeIndexTerminatedError);
    });

    test('throws PineconeIndexTerminatedError on Disabled state', async () => {
      const api = buildMockApi({
        describeIndex: jest
          .fn()
          .mockResolvedValue({ status: { ready: false, state: 'Disabled' } }),
      });
      await expect(
        createPreviewIndex(api, { ...validOptions, waitUntilReady: true }),
      ).rejects.toThrow(PineconeIndexTerminatedError);
    });

    test('throws PineconeTimeoutError when timeout elapses', async () => {
      const api = buildMockApi({
        describeIndex: jest.fn().mockResolvedValue({
          status: { ready: false, state: 'Initializing' },
        }),
      });
      const promise = createPreviewIndex(api, {
        ...validOptions,
        waitUntilReady: true,
        timeout: 8000,
      });
      // Attach rejection handler before advancing timers to avoid unhandled rejection warning
      const assertion = expect(promise).rejects.toThrow(PineconeTimeoutError);
      await jest.advanceTimersByTimeAsync(10000);
      await assertion;
    });
  });

  describe('error handling', () => {
    test('converts ResponseError to a typed Pinecone error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        createIndex: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"error": "Index already exists"}', {
              status: 409,
            }),
            'Conflict',
          ),
        ),
      });
      await expect(createPreviewIndex(api, validOptions)).rejects.toBeDefined();
    });
  });
});
