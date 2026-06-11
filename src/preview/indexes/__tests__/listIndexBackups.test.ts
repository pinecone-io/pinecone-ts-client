import { listPreviewIndexBackups } from '../listIndexBackups';
import type { PreviewListIndexBackupsOptions } from '../listIndexBackups';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    listIndexBackups: jest.fn().mockResolvedValue({
      data: [
        {
          backupId: 'bk-123',
          sourceIndexName: 'my-index',
          sourceIndexId: 'idx-abc',
          status: 'Ready',
          cloud: 'aws',
          region: 'us-east-1',
        },
      ],
      pagination: { next: undefined },
    }),
    ...overrides,
  }) as ManageIndexesApi;

describe('listPreviewIndexBackups', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when indexName is empty', async () => {
      await expect(listPreviewIndexBackups(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });

    test('error message references the `indexName` field', async () => {
      await expect(listPreviewIndexBackups(buildMockApi(), '')).rejects.toThrow(
        '`indexName`',
      );
    });
  });

  describe('success', () => {
    test('returns BackupList on success', async () => {
      const result = await listPreviewIndexBackups(buildMockApi(), 'my-index');
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({ backupId: 'bk-123' });
    });

    test('passes indexName to the API', async () => {
      const api = buildMockApi();
      await listPreviewIndexBackups(api, 'my-index');
      expect(api.listIndexBackups).toHaveBeenCalledWith(
        expect.objectContaining({ indexName: 'my-index' }),
      );
    });

    test('passes limit and paginationToken when provided', async () => {
      const api = buildMockApi();
      const options: PreviewListIndexBackupsOptions = {
        limit: 5,
        paginationToken: 'tok123',
      };
      await listPreviewIndexBackups(api, 'my-index', options);
      expect(api.listIndexBackups).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, paginationToken: 'tok123' }),
      );
    });

    test('omits limit and paginationToken when options not provided', async () => {
      const api = buildMockApi();
      await listPreviewIndexBackups(api, 'my-index');
      expect(api.listIndexBackups).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: undefined,
          paginationToken: undefined,
        }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await listPreviewIndexBackups(api, 'my-index');
      expect(api.listIndexBackups).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        listIndexBackups: jest
          .fn()
          .mockRejectedValue(new Response('Not Found', { status: 404 })),
      });
      await expect(
        listPreviewIndexBackups(api, 'my-index'),
      ).rejects.toBeDefined();
    });
  });
});
