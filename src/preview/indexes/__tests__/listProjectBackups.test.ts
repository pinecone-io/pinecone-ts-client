import { listPreviewProjectBackups } from '../listProjectBackups';
import type { PreviewListProjectBackupsOptions } from '../listProjectBackups';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    listProjectBackups: jest.fn().mockResolvedValue({
      data: [
        {
          backup_id: 'bk-proj-1',
          source_index_name: 'index-a',
          source_index_id: 'idx-001',
          status: 'Ready',
          cloud: 'aws',
          region: 'us-east-1',
        },
        {
          backup_id: 'bk-proj-2',
          source_index_name: 'index-b',
          source_index_id: 'idx-002',
          status: 'Ready',
          cloud: 'aws',
          region: 'us-west-2',
        },
      ],
      pagination: { next: undefined },
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('listPreviewProjectBackups', () => {
  describe('success', () => {
    test('returns BackupList with data array', async () => {
      const result = await listPreviewProjectBackups(buildMockApi());
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('returns backup entries spanning multiple source indexes', async () => {
      const result = await listPreviewProjectBackups(buildMockApi());
      const names = result.data?.map((b) => b.source_index_name);
      expect(names).toContain('index-a');
      expect(names).toContain('index-b');
    });

    test('calls listProjectBackups with no required path args', async () => {
      const api = buildMockApi();
      await listPreviewProjectBackups(api);
      expect(api.listProjectBackups).toHaveBeenCalledTimes(1);
    });

    test('passes limit and paginationToken when provided', async () => {
      const api = buildMockApi();
      const options: PreviewListProjectBackupsOptions = {
        limit: 5,
        paginationToken: 'tok-abc',
      };
      await listPreviewProjectBackups(api, options);
      expect(api.listProjectBackups).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, paginationToken: 'tok-abc' }),
      );
    });

    test('omits limit and paginationToken when options not provided', async () => {
      const api = buildMockApi();
      await listPreviewProjectBackups(api);
      expect(api.listProjectBackups).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: undefined,
          paginationToken: undefined,
        }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await listPreviewProjectBackups(api);
      expect(api.listProjectBackups).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('pagination', () => {
    test('returns next pagination token when present', async () => {
      const api = buildMockApi({
        listProjectBackups: jest.fn().mockResolvedValue({
          data: [],
          pagination: { next: 'next-page-token' },
        }),
      });
      const result = await listPreviewProjectBackups(api);
      expect(result.pagination?.next).toEqual('next-page-token');
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        listProjectBackups: jest
          .fn()
          .mockRejectedValue(
            new Response('Internal Server Error', { status: 500 }),
          ),
      });
      await expect(listPreviewProjectBackups(api)).rejects.toBeDefined();
    });
  });
});
