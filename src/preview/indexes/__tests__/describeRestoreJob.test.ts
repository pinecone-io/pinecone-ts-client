import { describePreviewRestoreJob } from '../describeRestoreJob';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const mockRestoreJob = {
  restore_job_id: 'rj-abc123',
  backup_id: 'bk-xyz',
  target_index_name: 'my-restored-index',
  target_index_id: 'idx-111',
  status: 'Completed',
  percent_complete: 100,
};

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    describeRestoreJob: jest.fn().mockResolvedValue(mockRestoreJob),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('describePreviewRestoreJob', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when jobId is empty string', async () => {
      await expect(
        describePreviewRestoreJob(buildMockApi(), ''),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe('success', () => {
    test('returns the RestoreJobModel', async () => {
      const result = await describePreviewRestoreJob(
        buildMockApi(),
        'rj-abc123',
      );
      expect(result).toEqual(mockRestoreJob);
    });

    test('calls describeRestoreJob once with the correct jobId', async () => {
      const api = buildMockApi();
      await describePreviewRestoreJob(api, 'rj-abc123');
      expect(api.describeRestoreJob).toHaveBeenCalledTimes(1);
      expect(api.describeRestoreJob).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: 'rj-abc123' }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await describePreviewRestoreJob(api, 'rj-abc123');
      expect(api.describeRestoreJob).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        describeRestoreJob: jest
          .fn()
          .mockRejectedValue(
            new Response('Internal Server Error', { status: 500 }),
          ),
      });
      await expect(
        describePreviewRestoreJob(api, 'rj-abc123'),
      ).rejects.toBeDefined();
    });
  });
});
