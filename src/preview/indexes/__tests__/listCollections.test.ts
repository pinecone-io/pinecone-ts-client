import { listPreviewCollections } from '../listCollections';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    listCollections: jest.fn().mockResolvedValue({
      collections: [
        {
          name: 'col-a',
          status: 'Ready',
          dimension: 3,
          environment: 'us-east1-gcp',
        },
      ],
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('listPreviewCollections', () => {
  describe('success', () => {
    test('returns CollectionList with collections array', async () => {
      const result = await listPreviewCollections(buildMockApi());
      expect(result).toHaveProperty('collections');
      expect(Array.isArray(result.collections)).toBe(true);
    });

    test('returns empty collections array when no collections exist', async () => {
      const api = buildMockApi({
        listCollections: jest.fn().mockResolvedValue({ collections: [] }),
      });
      const result = await listPreviewCollections(api);
      expect(result).toEqual({ collections: [] });
    });

    test('calls api.listCollections with alpha API version header', async () => {
      const api = buildMockApi();
      await listPreviewCollections(api);
      expect(api.listCollections).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts 401 ResponseError to a typed Pinecone error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        listCollections: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('Unauthorized', { status: 401 }),
              'Unauthorized',
            ),
          ),
      });
      await expect(listPreviewCollections(api)).rejects.toBeDefined();
    });
  });
});
