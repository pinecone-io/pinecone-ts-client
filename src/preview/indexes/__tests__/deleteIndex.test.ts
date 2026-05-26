import { deletePreviewIndex } from '../deleteIndex';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    deleteIndex: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('deletePreviewIndex', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when name is empty string', async () => {
      await expect(deletePreviewIndex(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });

    test('error message references the `name` field', async () => {
      await expect(deletePreviewIndex(buildMockApi(), '')).rejects.toThrow(
        '`name`',
      );
    });
  });

  describe('success', () => {
    test('calls api.deleteIndex with correct indexName', async () => {
      const api = buildMockApi();
      await deletePreviewIndex(api, 'my-index');
      expect(api.deleteIndex).toHaveBeenCalledWith(
        expect.objectContaining({ indexName: 'my-index' }),
      );
    });

    test('returns undefined (void) on success', async () => {
      const result = await deletePreviewIndex(buildMockApi(), 'my-index');
      expect(result).toBeUndefined();
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await deletePreviewIndex(api, 'my-index');
      expect(api.deleteIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('rethrows error from handleApiError', async () => {
      const api = buildMockApi({
        deleteIndex: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      await expect(deletePreviewIndex(api, 'my-index')).rejects.toBeDefined();
    });

    test('converts ResponseError to a typed Pinecone error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        deleteIndex: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('{"error": "Index not found"}', { status: 404 }),
              'Not Found',
            ),
          ),
      });
      await expect(
        deletePreviewIndex(api, 'missing-index'),
      ).rejects.toBeDefined();
    });

    test('throws on deletion-protection 403', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        deleteIndex: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response(
                '{"error": "Deletion protection is enabled for this index."}',
                { status: 403 },
              ),
              'Forbidden',
            ),
          ),
      });
      await expect(
        deletePreviewIndex(api, 'protected-index'),
      ).rejects.toBeDefined();
    });
  });
});
