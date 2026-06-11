import { createPreviewBackup } from '../createBackup';
import {
  PineconeArgumentError,
  PineconeBadRequestError,
  PineconeConnectionError,
} from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    createBackup: jest.fn().mockResolvedValue({
      backupId: 'bk-123',
      sourceIndexName: 'my-index',
      sourceIndexId: 'idx-abc',
      status: 'Initializing',
      cloud: 'aws',
      region: 'us-east-1',
    }),
    ...overrides,
  }) as ManageIndexesApi;

describe('createPreviewBackup', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when indexName is empty string', async () => {
      await expect(createPreviewBackup(buildMockApi(), '')).rejects.toThrow(
        PineconeArgumentError,
      );
    });

    test('error message references the `indexName` field', async () => {
      await expect(createPreviewBackup(buildMockApi(), '')).rejects.toThrow(
        '`indexName`',
      );
    });
  });

  describe('success', () => {
    test('returns BackupModel on success', async () => {
      const result = await createPreviewBackup(buildMockApi(), 'my-index');
      expect(result).toMatchObject({
        backupId: 'bk-123',
        status: 'Initializing',
      });
    });

    test('passes indexName to the API', async () => {
      const api = buildMockApi();
      await createPreviewBackup(api, 'my-index');
      expect(api.createBackup).toHaveBeenCalledWith(
        expect.objectContaining({ indexName: 'my-index' }),
      );
    });

    test('passes name and description when provided', async () => {
      const api = buildMockApi();
      await createPreviewBackup(api, 'my-index', {
        name: 'snap',
        description: 'nightly',
      });
      expect(api.createBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          createBackupRequest: { name: 'snap', description: 'nightly' },
        }),
      );
    });

    test('passes empty createBackupRequest when options omitted', async () => {
      const api = buildMockApi();
      await createPreviewBackup(api, 'my-index');
      expect(api.createBackup).toHaveBeenCalledWith(
        expect.objectContaining({ createBackupRequest: {} }),
      );
    });

    test('uses alpha API version header', async () => {
      const api = buildMockApi();
      await createPreviewBackup(api, 'my-index');
      expect(api.createBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        createBackup: jest.fn().mockRejectedValue(
          Object.assign(new Error(), {
            status: 404,
            text: async () => 'Index not found',
          }),
        ),
      });
      await expect(createPreviewBackup(api, 'my-index')).rejects.toThrow();
    });

    test('does not re-wrap PineconeBadRequestError from middleware as PineconeConnectionError', async () => {
      const badRequestError = new PineconeBadRequestError({
        status: 400,
        message: 'Backup creation is not supported for this index',
      });
      const api = buildMockApi({
        createBackup: jest.fn().mockRejectedValue(badRequestError),
      });
      await expect(createPreviewBackup(api, 'my-index')).rejects.toThrow(
        PineconeBadRequestError,
      );
      await expect(createPreviewBackup(api, 'my-index')).rejects.not.toThrow(
        PineconeConnectionError,
      );
    });
  });
});
