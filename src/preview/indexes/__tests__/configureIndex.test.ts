import { configurePreviewIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const makeFakeApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    configureIndex: jest
      .fn()
      .mockResolvedValue({ name: 'my-index', status: { ready: true } }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('configurePreviewIndex', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when name is empty string', async () => {
      await expect(
        configurePreviewIndex(makeFakeApi(), '', {
          deletionProtection: 'enabled',
        }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `name` field', async () => {
      await expect(
        configurePreviewIndex(makeFakeApi(), '', {}),
      ).rejects.toThrow('`name`');
    });
  });

  describe('success', () => {
    test('calls api.configureIndex with correct args', async () => {
      const fakeApi = makeFakeApi();
      await configurePreviewIndex(fakeApi, 'my-index', {
        deletionProtection: 'enabled',
      });
      expect(fakeApi.configureIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: 'my-index',
          configureIndexRequest: { deletionProtection: 'enabled' },
        }),
      );
    });

    test('passes alpha API version header', async () => {
      const fakeApi = makeFakeApi();
      await configurePreviewIndex(fakeApi, 'my-index', {});
      expect(fakeApi.configureIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('returns IndexModel on success', async () => {
      const fakeApi = makeFakeApi({
        configureIndex: jest.fn().mockResolvedValue({
          name: 'my-index',
          status: { ready: true },
        }),
      });
      const result = await configurePreviewIndex(fakeApi, 'my-index', {
        deletionProtection: 'enabled',
      });
      expect(result).toMatchObject({ name: 'my-index' });
    });

    test('passes tags when provided', async () => {
      const fakeApi = makeFakeApi();
      await configurePreviewIndex(fakeApi, 'my-index', {
        tags: { env: 'test' },
      });
      expect(fakeApi.configureIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          configureIndexRequest: expect.objectContaining({
            tags: { env: 'test' },
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const fakeApi = makeFakeApi({
        configureIndex: jest.fn().mockRejectedValue(
          Object.assign(new Error(), {
            status: 404,
            text: async () => 'Index not found',
          }),
        ),
      });
      await expect(
        configurePreviewIndex(fakeApi, 'no-such-index', {}),
      ).rejects.toThrow();
    });
  });
});
