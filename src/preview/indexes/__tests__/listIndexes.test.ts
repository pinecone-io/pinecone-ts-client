import { listPreviewIndexes } from '../listIndexes';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    listIndexes: jest.fn().mockResolvedValue({ indexes: [] }),
    ...overrides,
  }) as ManageIndexesApi;

describe('listPreviewIndexes', () => {
  describe('success', () => {
    test('returns IndexList on success', async () => {
      const api = buildMockApi({
        listIndexes: jest.fn().mockResolvedValue({
          indexes: [{ name: 'my-index', schema: { fields: {} } }],
        }),
      });
      const result = await listPreviewIndexes(api);
      expect(result).toMatchObject({ indexes: [{ name: 'my-index' }] });
    });

    test('calls api.listIndexes with alpha API version header', async () => {
      const api = buildMockApi();
      await listPreviewIndexes(api);
      expect(api.listIndexes).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('returns empty list when no indexes exist', async () => {
      const api = buildMockApi();
      const result = await listPreviewIndexes(api);
      expect(result.indexes).toEqual([]);
    });
  });

  describe('error handling', () => {
    test('rethrows error from handleApiError', async () => {
      const api = buildMockApi({
        listIndexes: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      await expect(listPreviewIndexes(api)).rejects.toBeDefined();
    });
  });
});
