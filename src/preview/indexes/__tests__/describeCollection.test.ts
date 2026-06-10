import { describePreviewCollection } from '../describeCollection';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    describeCollection: jest.fn().mockResolvedValue({
      name: 'my-collection',
      status: 'Ready',
      environment: 'us-east1-gcp',
      size: 3126700,
      dimension: 3,
      vector_count: 99,
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('describePreviewCollection', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when collectionName is empty', async () => {
      await expect(
        describePreviewCollection(buildMockApi(), ''),
      ).rejects.toThrow('`collectionName`');
    });
  });

  describe('success', () => {
    test('returns CollectionModel on success', async () => {
      const result = await describePreviewCollection(
        buildMockApi(),
        'my-collection',
      );
      expect(result).toMatchObject({
        name: 'my-collection',
        status: 'Ready',
        environment: 'us-east1-gcp',
      });
    });

    test('calls api.describeCollection with the correct collectionName', async () => {
      const api = buildMockApi();
      await describePreviewCollection(api, 'my-collection');
      expect(api.describeCollection).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'my-collection' }),
      );
    });

    test('calls api.describeCollection with alpha API version header', async () => {
      const api = buildMockApi();
      await describePreviewCollection(api, 'my-collection');
      expect(api.describeCollection).toHaveBeenCalledWith(
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
        describeCollection: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('Not Found', { status: 404 }),
              'Not Found',
            ),
          ),
      });
      await expect(
        describePreviewCollection(api, 'missing-collection'),
      ).rejects.toBeDefined();
    });
  });
});
