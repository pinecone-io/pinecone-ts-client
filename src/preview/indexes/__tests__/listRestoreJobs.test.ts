import { listPreviewRestoreJobs } from '../listRestoreJobs';
import type { PreviewListRestoreJobsOptions } from '../listRestoreJobs';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const mockRestoreJob = {
  restoreJobId: 'rj-abc123',
  backupId: 'bk-xyz',
  targetIndexName: 'my-restored-index',
  targetIndexId: 'idx-111',
  status: 'Initializing',
};

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    listRestoreJobs: jest.fn().mockResolvedValue({
      data: [mockRestoreJob],
      pagination: null,
    }),
    ...overrides,
  }) as ManageIndexesApi;

describe('listPreviewRestoreJobs', () => {
  describe('success', () => {
    test('returns RestoreJobList with data array', async () => {
      const result = await listPreviewRestoreJobs(buildMockApi());
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    test('calls listRestoreJobs once', async () => {
      const api = buildMockApi();
      await listPreviewRestoreJobs(api);
      expect(api.listRestoreJobs).toHaveBeenCalledTimes(1);
    });

    test('passes limit and paginationToken when provided', async () => {
      const api = buildMockApi();
      const options: PreviewListRestoreJobsOptions = {
        limit: 5,
        paginationToken: 'tok-abc',
      };
      await listPreviewRestoreJobs(api, options);
      expect(api.listRestoreJobs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, paginationToken: 'tok-abc' }),
      );
    });

    test('omits limit and paginationToken when options not provided', async () => {
      const api = buildMockApi();
      await listPreviewRestoreJobs(api);
      expect(api.listRestoreJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: undefined,
          paginationToken: undefined,
        }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await listPreviewRestoreJobs(api);
      expect(api.listRestoreJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('pagination', () => {
    test('returns next pagination token when present', async () => {
      const api = buildMockApi({
        listRestoreJobs: jest.fn().mockResolvedValue({
          data: [],
          pagination: { next: 'next-page-token' },
        }),
      });
      const result = await listPreviewRestoreJobs(api);
      expect(result.pagination?.next).toEqual('next-page-token');
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        listRestoreJobs: jest
          .fn()
          .mockRejectedValue(
            new Response('Internal Server Error', { status: 500 }),
          ),
      });
      await expect(listPreviewRestoreJobs(api)).rejects.toBeDefined();
    });
  });
});
