import { createPreviewIndex } from '../createIndex';
import { PineconeArgumentError } from '../../../errors';
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
