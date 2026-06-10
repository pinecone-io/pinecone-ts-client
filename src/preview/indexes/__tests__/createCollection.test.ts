import { createPreviewCollection } from '../createCollection';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    createCollection: jest.fn().mockResolvedValue({
      name: 'test-collection',
      status: 'Initializing',
      environment: 'us-east1-gcp',
      dimension: 3,
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('createPreviewCollection', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when name is empty', async () => {
      await expect(
        createPreviewCollection(buildMockApi(), {
          name: '',
          source: 'my-index',
        }),
      ).rejects.toThrow('`name`');
    });

    test('throws PineconeArgumentError when source is empty', async () => {
      await expect(
        createPreviewCollection(buildMockApi(), { name: 'col', source: '' }),
      ).rejects.toThrow('`source`');
    });
  });

  describe('success', () => {
    test('returns CollectionModel on success', async () => {
      const result = await createPreviewCollection(buildMockApi(), {
        name: 'test-collection',
        source: 'my-index',
      });
      expect(result).toMatchObject({
        name: 'test-collection',
        status: 'Initializing',
      });
    });

    test('calls api.createCollection with alpha API version header', async () => {
      const api = buildMockApi();
      await createPreviewCollection(api, {
        name: 'test-collection',
        source: 'my-index',
      });
      expect(api.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('passes name and source in the request body', async () => {
      const api = buildMockApi();
      await createPreviewCollection(api, {
        name: 'my-col',
        source: 'my-index',
      });
      expect(api.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          createCollectionRequest: { name: 'my-col', source: 'my-index' },
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts 409 ResponseError to a thrown error', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_control');
      const api = buildMockApi({
        createCollection: jest
          .fn()
          .mockRejectedValue(
            new ResponseError(
              new Response('Already exists', { status: 409 }),
              'Already exists',
            ),
          ),
      });
      await expect(
        createPreviewCollection(api, { name: 'my-col', source: 'my-index' }),
      ).rejects.toBeDefined();
    });
  });
});
