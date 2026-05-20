import { deletePreviewBackup } from '../deleteBackup';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    deleteBackup: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('deletePreviewBackup', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when backupId is empty', async () => {
      await expect(deletePreviewBackup(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });
    test('error message references the `backupId` field', async () => {
      await expect(deletePreviewBackup(buildMockApi(), '')).rejects.toThrow(
        '`backupId`',
      );
    });
  });

  describe('success', () => {
    test('returns void on success', async () => {
      const result = await deletePreviewBackup(buildMockApi(), 'bk-123');
      expect(result).toBeUndefined();
    });
    test('passes backupId to the API client', async () => {
      const api = buildMockApi();
      await deletePreviewBackup(api, 'bk-abc');
      expect(api.deleteBackup).toHaveBeenCalledWith(
        expect.objectContaining({ backupId: 'bk-abc' }),
      );
    });
    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await deletePreviewBackup(api, 'bk-123');
      expect(api.deleteBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('propagates errors from the API client', async () => {
      const api = buildMockApi({
        deleteBackup: jest
          .fn()
          .mockRejectedValue(new Response('Not Found', { status: 404 })),
      });
      await expect(
        deletePreviewBackup(api, 'bk-missing'),
      ).rejects.toBeDefined();
    });
  });
});
