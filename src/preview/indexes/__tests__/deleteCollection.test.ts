import { deletePreviewCollection } from '../deleteCollection';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    deleteCollection: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as ManageIndexesApi;

describe('deletePreviewCollection', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when collectionName is empty', async () => {
      await expect(deletePreviewCollection(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );

      await expect(deletePreviewCollection(buildMockApi(), '')).rejects.toThrow(
        '`collectionName`',
      );
    });
  });

  describe('success', () => {
    test('resolves without a value on success', async () => {
      const result = await deletePreviewCollection(
        buildMockApi(),
        'my-collection',
      );
      expect(result).toBeUndefined();
    });

    test('calls api.deleteCollection with the correct collectionName', async () => {
      const api = buildMockApi();
      await deletePreviewCollection(api, 'my-collection');
      expect(api.deleteCollection).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'my-collection' }),
      );
    });

    test('calls api.deleteCollection with alpha API version header', async () => {
      const api = buildMockApi();
      await deletePreviewCollection(api, 'my-collection');
      expect(api.deleteCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts 404 ResponseError to a thrown error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        deleteCollection: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('Not Found', { status: 404 }),
              'Not Found',
            ),
          ),
      });
      await expect(
        deletePreviewCollection(api, 'missing-collection'),
      ).rejects.toBeDefined();
    });
  });
});
