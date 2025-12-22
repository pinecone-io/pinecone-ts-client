import { describeBackup } from '../describeBackup';
import { PineconeArgumentError } from '../../errors';
import {
  BackupModel,
  DescribeBackupRequest,
  ManageIndexesApi,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('describeBackup', () => {
  const setupSuccessResponse = (responseData) => {
    const fakeDescribeBackup: (
      req: DescribeBackupRequest
    ) => Promise<BackupModel> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));
    const MIA = {
      describeBackup: fakeDescribeBackup,
    } as unknown as ManageIndexesApi;

    return MIA;
  };

  test('calls the openapi describe backup endpoint, passing backupId', async () => {
    const MIA = setupSuccessResponse(undefined);
    const returned = await describeBackup(MIA)('backup-id');
    expect(returned).toEqual(undefined);
    expect(MIA.describeBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        backupId: 'backup-id',
      })
    );
  });

  test('should throw backupId is not provided', async () => {
    const MIA = setupSuccessResponse('');
    // @ts-ignore
    await expect(describeBackup(MIA)()).rejects.toThrow(
      'You must pass a non-empty string for `backupId` in order to describe a backup'
    );
    await expect(describeBackup(MIA)('')).rejects.toThrow(
      PineconeArgumentError
    );
  });
});
