import { describeRestoreJob } from '../describeRestoreJob';
import { PineconeArgumentError } from '../../errors';
import {
  DescribeRestoreJobRequest,
  ManageIndexesApi,
  RestoreJobModel,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('describeRestoreJob', () => {
  const setupSuccessResponse = (responseData) => {
    const fakeDescribeRestoreJob: (
      req: DescribeRestoreJobRequest
    ) => Promise<RestoreJobModel> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));
    const MIA = {
      describeRestoreJob: fakeDescribeRestoreJob,
    } as ManageIndexesApi;

    return MIA;
  };

  test('calls the openapi describe restore job endpoint, passing jobId', async () => {
    const MIA = setupSuccessResponse(undefined);
    const returned = await describeRestoreJob(MIA)('restore-job-id');
    expect(returned).toEqual(undefined);
    expect(MIA.describeRestoreJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'restore-job-id',
      })
    );
  });

  test('should throw backupId is not provided', async () => {
    const MIA = setupSuccessResponse('');
    // @ts-ignore
    await expect(describeRestoreJob(MIA)()).rejects.toThrow(
      'You must pass a non-empty string for `restoreJobId` in order to describe a restore job'
    );
    await expect(describeRestoreJob(MIA)('')).rejects.toThrow(
      PineconeArgumentError
    );
  });
});
