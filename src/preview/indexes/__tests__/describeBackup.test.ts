import { describePreviewBackup } from '../describeBackup';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    describeBackup: jest.fn().mockResolvedValue({
      backupId: 'bk-123',
      sourceIndexName: 'my-index',
      sourceIndexId: 'idx-abc',
      status: 'Ready',
      cloud: 'aws',
      region: 'us-east-1',
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('describePreviewBackup', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when backupId is empty', async () => {
      await expect(describePreviewBackup(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });
    test('error message references the `backupId` field', async () => {
      await expect(describePreviewBackup(buildMockApi(), '')).rejects.toThrow(
        '`backupId`',
      );
    });
  });

  describe('success', () => {
    test('returns BackupModel on success', async () => {
      const result = await describePreviewBackup(buildMockApi(), 'bk-123');
      expect(result).toMatchObject({ backupId: 'bk-123', status: 'Ready' });
    });
    test('passes backupId to the API client', async () => {
      const api = buildMockApi();
      await describePreviewBackup(api, 'bk-abc');
      expect(api.describeBackup).toHaveBeenCalledWith(
        expect.objectContaining({ backupId: 'bk-abc' }),
      );
    });
    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await describePreviewBackup(api, 'bk-123');
      expect(api.describeBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('propagates errors from the API client', async () => {
      const api = buildMockApi({
        describeBackup: jest
          .fn()
          .mockRejectedValue(new Response('Not Found', { status: 404 })),
      });
      await expect(
        describePreviewBackup(api, 'bk-missing'),
      ).rejects.toBeDefined();
    });
  });
});
