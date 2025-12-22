import { listRestoreJobs } from '../listRestoreJobs';
import {
  RestoreJobList,
  ManageIndexesApi,
  ListRestoreJobsRequest,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('listBackups', () => {
  const setupSuccessResponse = (responseData = {}) => {
    const fakeListRestoreJobs: (
      req: ListRestoreJobsRequest
    ) => Promise<RestoreJobList> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));

    const MIA = {
      listRestoreJobs: fakeListRestoreJobs,
    } as unknown as ManageIndexesApi;

    return MIA;
  };

  test('calls the openapi describe index backup endpoint when indexName provided', async () => {
    const MIA = setupSuccessResponse();
    await listRestoreJobs(MIA)({
      limit: 10,
      paginationToken: 'pagination-token',
    });
    expect(MIA.listRestoreJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        paginationToken: 'pagination-token',
      })
    );
  });
});
