import { describePreviewIndex } from '../describeIndex';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const mockIndexModel = {
  name: 'my-index',
  host: 'my-index.svc.pinecone.io',
  status: { ready: true, state: 'Ready' },
  schema: { fields: { genre: { type: 'string' as const } } },
  deployment: { deployment_type: 'managed' },
  deletion_protection: 'disabled',
};

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    describeIndex: jest.fn().mockResolvedValue(mockIndexModel),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('describePreviewIndex', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when indexName is empty string', async () => {
      await expect(describePreviewIndex(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });

    test('error message references the `indexName` field', async () => {
      await expect(describePreviewIndex(buildMockApi(), '')).rejects.toThrow(
        '`indexName`',
      );
    });
  });

  describe('success', () => {
    test('returns IndexModel on success', async () => {
      const result = await describePreviewIndex(buildMockApi(), 'my-index');
      expect(result).toMatchObject({ name: 'my-index' });
    });

    test('passes indexName to the API client', async () => {
      const api = buildMockApi();
      await describePreviewIndex(api, 'my-index');
      expect(api.describeIndex).toHaveBeenCalledWith(
        expect.objectContaining({ indexName: 'my-index' }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await describePreviewIndex(api, 'my-index');
      expect(api.describeIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('returns schema field when index has a schema', async () => {
      const result = await describePreviewIndex(buildMockApi(), 'my-index');
      expect(result.schema).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('rethrows error from handleApiError', async () => {
      const api = buildMockApi({
        describeIndex: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      await expect(describePreviewIndex(api, 'my-index')).rejects.toBeDefined();
    });

    test('converts ResponseError to a typed Pinecone error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        describeIndex: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('{"error": "Index not found"}', { status: 404 }),
              'Not Found',
            ),
          ),
      });
      await expect(
        describePreviewIndex(api, 'missing-index'),
      ).rejects.toBeDefined();
    });
  });
});
