import { createIndexFromBackup } from '../createIndexFromBackup';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const mockResponse = { restore_job_id: 'rj-abc123', index_id: 'idx-xyz789' };

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    createIndexFromBackupOperation: jest.fn().mockResolvedValue(mockResponse),
    ...overrides,
  }) as ManageIndexesApi;

describe('createIndexFromBackup', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when backupId is empty', async () => {
      await expect(
        createIndexFromBackup(buildMockApi(), '', { name: 'my-index' }),
      ).rejects.toThrow(PineconeArgumentError);
    });
    test('error message references `backupId` field', async () => {
      await expect(
        createIndexFromBackup(buildMockApi(), '', { name: 'my-index' }),
      ).rejects.toThrow('`backupId`');
    });
    test('throws PineconeArgumentError when name is empty', async () => {
      await expect(
        createIndexFromBackup(buildMockApi(), 'bk-123', { name: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });
    test('error message references `name` field', async () => {
      await expect(
        createIndexFromBackup(buildMockApi(), 'bk-123', { name: '' }),
      ).rejects.toThrow('`name`');
    });
  });

  describe('success', () => {
    test('returns CreateIndexFromBackupResponse on success', async () => {
      const result = await createIndexFromBackup(buildMockApi(), 'bk-abc', {
        name: 'restored-index',
      });
      expect(result).toEqual(mockResponse);
    });
    test('passes backupId and name to the API client', async () => {
      const api = buildMockApi();
      await createIndexFromBackup(api, 'bk-abc', { name: 'restored-index' });
      expect(api.createIndexFromBackupOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          backupId: 'bk-abc',
          createIndexFromBackupRequest: expect.objectContaining({
            name: 'restored-index',
          }),
        }),
      );
    });
    test('passes optional tags to the API client when provided', async () => {
      const api = buildMockApi();
      await createIndexFromBackup(api, 'bk-abc', {
        name: 'restored-index',
        tags: { env: 'test' },
      });
      expect(api.createIndexFromBackupOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexFromBackupRequest: expect.objectContaining({
            tags: { env: 'test' },
          }),
        }),
      );
    });
    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await createIndexFromBackup(api, 'bk-abc', { name: 'restored-index' });
      expect(api.createIndexFromBackupOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('propagates errors from the API client', async () => {
      const api = buildMockApi({
        createIndexFromBackupOperation: jest
          .fn()
          .mockRejectedValue(new Response('Not Found', { status: 404 })),
      });
      await expect(
        createIndexFromBackup(api, 'bk-missing', { name: 'idx' }),
      ).rejects.toBeDefined();
    });
  });
});
