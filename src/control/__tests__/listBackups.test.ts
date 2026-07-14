import { listBackups } from '../listBackups';
import {
  BackupList,
  ListIndexBackupsRequest,
  ListProjectBackupsRequest,
  ManageIndexesApi,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('listBackups', () => {
  const setupSuccessResponse = (responseData = {}) => {
    const fakeListIndexBackups: (
      req: ListIndexBackupsRequest,
    ) => Promise<BackupList> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));

    const fakeListProjectBackups: (
      req: ListProjectBackupsRequest,
    ) => Promise<BackupList> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responseData));

    const MIA = {
      listIndexBackups: fakeListIndexBackups,
      listProjectBackups: fakeListProjectBackups,
    } as ManageIndexesApi;

    return MIA;
  };

  test('calls the openapi describe index backup endpoint when indexName provided', async () => {
    const MIA = setupSuccessResponse();
    await listBackups(MIA)({
      indexName: 'my-index',
      limit: 10,
      paginationToken: 'pagination-token',
    });
    expect(MIA.listIndexBackups).toHaveBeenCalledWith(
      expect.objectContaining({
        indexName: 'my-index',
        limit: 10,
        paginationToken: 'pagination-token',
      }),
    );
  });

  test('calls the openapi describe project backup endpoint when indexName is not provided', async () => {
    const MIA = setupSuccessResponse(undefined);
    await listBackups(MIA)();
    expect(MIA.listProjectBackups).toHaveBeenCalled();
  });
});
