import { createIndexFromBackup } from '../createIndexFromBackup';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  BackupModel,
  CreateIndexFromBackupOperationRequest,
  CreateIndexFromBackupResponse,
} from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';

const setupCreateIndexFromBackupResponse = (
  createIndexFromBackupResponse = {} as BackupModel,
  isCreateIndexFromBackupSuccess = true
) => {
  const fakeCreateIndexFromBackup: (
    req: CreateIndexFromBackupOperationRequest
  ) => Promise<CreateIndexFromBackupResponse> = jest
    .fn()
    .mockImplementation(() =>
      isCreateIndexFromBackupSuccess
        ? Promise.resolve(createIndexFromBackupResponse)
        : Promise.reject(createIndexFromBackupResponse)
    );

  const MIA = {
    createIndexFromBackupOperation: fakeCreateIndexFromBackup,
  } as unknown as ManageIndexesApi;

  return MIA;
};

describe('createIndexFromBackup', () => {
  test('calls the openapi create indexn from backup endpoint, passing backupId, name, tags, and deletionProtection', async () => {
    const MIA = setupCreateIndexFromBackupResponse();
    const returned = await createIndexFromBackup(MIA)({
      backupId: '12345-ajfielkas-123123',
      name: 'my-restored-index',
      tags: { test: 'test-tag' },
      deletionProtection: 'enabled',
    });
    expect(returned).toEqual({} as CreateIndexFromBackupResponse);
    expect(MIA.createIndexFromBackupOperation).toHaveBeenCalledWith({
      backupId: '12345-ajfielkas-123123',
      createIndexFromBackupRequest: {
        name: 'my-restored-index',
        tags: { test: 'test-tag' },
        deletionProtection: 'enabled',
      },
      xPineconeApiVersion: '2025-10',
    });
  });

  test('throws an error if backupId or name are not provided', async () => {
    const MIA = setupCreateIndexFromBackupResponse();
    await expect(
      createIndexFromBackup(MIA)({
        backupId: '',
        name: 'my-restored-index',
      })
    ).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass a non-empty string for `backupId` in order to create an index from backup'
      )
    );
    await expect(
      createIndexFromBackup(MIA)({
        backupId: '123-123-123-123',
        name: '',
      })
    ).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create an index from backup'
      )
    );
  });
});
