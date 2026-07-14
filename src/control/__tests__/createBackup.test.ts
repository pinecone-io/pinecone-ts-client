import { createBackup } from '../createBackup';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  BackupModel,
  CreateBackupOperationRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control/api_version';
import { PineconeArgumentError } from '../../errors';

const setupCreateBackupResponse = (
  createBackupResponse = {} as BackupModel,
  isCreateBackupSuccess = true,
) => {
  const fakeCreateBackup: (
    req: CreateBackupOperationRequest,
  ) => Promise<BackupModel> = jest
    .fn()
    .mockImplementation(() =>
      isCreateBackupSuccess
        ? Promise.resolve(createBackupResponse)
        : Promise.reject(createBackupResponse),
    );

  const MIA = {
    createBackup: fakeCreateBackup,
  } as ManageIndexesApi;

  return MIA;
};

describe('createBackup', () => {
  test('calls the openapi create backup endpoint, passing name and description', async () => {
    const MIA = setupCreateBackupResponse();
    const returned = await createBackup(MIA)({
      indexName: 'index-name',
      name: 'backup-name',
      description: 'backup-description',
    });
    expect(returned).toEqual({} as BackupModel);
    expect(MIA.createBackup).toHaveBeenCalledWith({
      indexName: 'index-name',
      createBackupRequest: {
        name: 'backup-name',
        description: 'backup-description',
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('throws an error if indexName is not provided', async () => {
    const MIA = setupCreateBackupResponse();
    await expect(
      createBackup(MIA)({
        indexName: '',
        name: 'backup-name',
        description: 'backup-description',
      }),
    ).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` in order to create a backup',
      ),
    );
  });
});
