import { deleteBackup } from '../deleteBackup';
import { PineconeArgumentError } from '../../errors';
import {
  DeleteBackupRequest,
  ManageIndexesApi,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('deleteBackup', () => {
  const setupSuccessResponse = (responseData) => {
    const fakeDeleteBackup: (req: DeleteBackupRequest) => Promise<void> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));
    const MIA = {
      deleteBackup: fakeDeleteBackup,
    } as ManageIndexesApi;

    return MIA;
  };

  test('calls the openapi delete backup endpoint, passing backupId', async () => {
    const MIA = setupSuccessResponse(undefined);
    const returned = await deleteBackup(MIA)('backup-id');
    expect(returned).toEqual(undefined);
    expect(MIA.deleteBackup).toHaveBeenCalledWith({
      backupId: 'backup-id',
    });
  });

  test('should throw backupId is not provided', async () => {
    const MIA = setupSuccessResponse('');
    // @ts-ignore
    await expect(deleteBackup(MIA)()).rejects.toThrow(
      'You must pass a non-empty string for `backupId` in order to delete a backup'
    );
    await expect(deleteBackup(MIA)('')).rejects.toThrow(PineconeArgumentError);
  });
});
