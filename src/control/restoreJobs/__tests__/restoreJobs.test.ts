import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import type {
  RestoreJobModel,
  RestoreJobList,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeArgumentError,
  PineconeNotFoundError,
  PineconeBadRequestError,
} from '../../../errors';
import { indexOperationsBuilder } from '../../indexOperationsBuilder';
import { RestoreJobs } from '../restoreJobs';

jest.mock('../../indexOperationsBuilder');
const job: RestoreJobModel = {
  restoreJobId: 'job-123',
  backupId: 'backup-123',
  targetIndexName: 'restored-index',
  targetIndexId: 'index-123',
  status: 'Completed',
  createdAt: new Date('2026-07-01T00:00:00Z'),
  completedAt: new Date('2026-07-01T00:01:00Z'),
  percentComplete: 100,
};
const page: RestoreJobList = { data: [job], pagination: { next: 'next-page' } };

describe('RestoreJobs operation contracts through the public facade', () => {
  let api: ManageIndexesApi;
  let jobs: RestoreJobs;
  beforeEach(() => {
    jest.resetAllMocks();
    api = new ManageIndexesApi();
    jest.spyOn(api, 'describeRestoreJob').mockResolvedValue(job);
    jest.spyOn(api, 'listRestoreJobs').mockResolvedValue(page);
    jest.mocked(indexOperationsBuilder).mockReturnValue(api);
    jobs = new RestoreJobs({
      apiKey: 'test-key',
      controllerHostUrl: 'https://controller.example.com',
    });
  });
  test('constructs its API with the supplied configuration', () => {
    expect(indexOperationsBuilder).toHaveBeenCalledTimes(1);
    expect(indexOperationsBuilder).toHaveBeenCalledWith({
      apiKey: 'test-key',
      controllerHostUrl: 'https://controller.example.com',
    });
  });
  test('describes using jobId rather than restoreJobId', async () => {
    await expect(jobs.describe('job-123')).resolves.toStrictEqual(job);
    expect(api.describeRestoreJob).toHaveBeenCalledTimes(1);
    expect(api.describeRestoreJob).toHaveBeenCalledWith({
      jobId: 'job-123',
      xPineconeApiVersion: '2026-07',
    });
  });
  test.each([undefined, {}, { limit: 5, paginationToken: 'previous-page' }])(
    'lists with pagination options %j',
    async (options) => {
      await expect(jobs.list(options)).resolves.toStrictEqual(page);
      expect(api.listRestoreJobs).toHaveBeenCalledTimes(1);
      expect(api.listRestoreJobs).toHaveBeenCalledWith({
        limit: options?.limit,
        paginationToken: options?.paginationToken,
        xPineconeApiVersion: '2026-07',
      });
    },
  );
  test.each(['', undefined, null])(
    'rejects jobId=%s before calling the API',
    async (value) => {
      await expect(
        jobs.describe(value as unknown as string),
      ).rejects.toMatchObject({
        name: 'PineconeArgumentError',
        message:
          'You must pass a non-empty string for `jobId` in order to describe a restore job.',
      });
      expect(api.describeRestoreJob).not.toHaveBeenCalled();
    },
  );
  const errorCalls = [
    [
      'describeRestoreJob',
      'Error describing restore job job-123: missing',
      (r: RestoreJobs) => r.describe('job-123'),
    ],
    [
      'listRestoreJobs',
      'Error listing restore jobs: missing',
      (r: RestoreJobs) => r.list(),
    ],
  ] as const;
  test.each(errorCalls)(
    '%s maps HTTP errors with operation context',
    async (method, message, invoke) => {
      jest.mocked(api[method]).mockRejectedValue(
        new ResponseError(
          new Response(JSON.stringify({ message: 'missing' }), {
            status: 400,
          }),
        ),
      );
      await expect(invoke(jobs)).rejects.toEqual(
        new PineconeBadRequestError({ status: 400, message }),
      );
    },
  );
  test.each(errorCalls)(
    '%s preserves SDK errors',
    async (method, _, invoke) => {
      const error = new PineconeArgumentError('already mapped');
      jest.mocked(api[method]).mockRejectedValue(error);
      await expect(invoke(jobs)).rejects.toBe(error);
    },
  );
  test.each(errorCalls)(
    '%s maps missing resources to a not-found error',
    async (method, _, invoke) => {
      jest
        .mocked(api[method])
        .mockRejectedValue(
          new ResponseError(new Response('missing', { status: 404 })),
        );
      await expect(invoke(jobs)).rejects.toBeInstanceOf(PineconeNotFoundError);
    },
  );
});
