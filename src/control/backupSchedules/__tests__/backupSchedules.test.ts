import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeArgumentError,
  PineconeNotFoundError,
  PineconeBadRequestError,
  PineconeConflictError,
} from '../../../errors';
import { indexOperationsBuilder } from '../../indexOperationsBuilder';
import { BackupSchedules } from '../backupSchedules';
import type { BackupScheduleModel } from '../describeBackupSchedule';
import type { BackupScheduleList } from '../listBackupSchedules';
import type {
  BackupScheduleHistoryItem,
  BackupScheduleHistoryList,
} from '../listBackupScheduleHistory';
import type { UpdateBackupScheduleOptions } from '../updateBackupSchedule';

jest.mock('../../indexOperationsBuilder');

const schedule: BackupScheduleModel = {
  scheduleId: 'schedule-123',
  name: 'compliance-snapshots',
  indexId: 'index-123',
  projectId: 'project-123',
  scheduleType: 'time-based',
  frequency: 'daily',
  retentionExpireAfterDays: 90,
  enabled: true,
  nextScheduledRun: new Date('2026-07-02T06:00:00Z'),
  createdAt: new Date('2026-07-01T00:00:00Z'),
};
const page: BackupScheduleList = {
  data: [schedule],
  pagination: { next: 'next-page' },
};
const run: BackupScheduleHistoryItem = {
  backupId: 'backup-123',
  sourceIndexId: 'index-123',
  sourceIndexName: 'source-index',
  name: 'compliance-snapshots-2026-07-02T06:00:00Z',
  status: 'Scheduled',
  cloud: 'aws',
  region: 'us-east-1',
  createdAt: new Date('2026-07-01T00:00:00Z'),
  scheduledExecutionAt: new Date('2026-07-02T06:00:00Z'),
};
const history: BackupScheduleHistoryList = {
  data: [run],
  pagination: { next: 'next-page' },
};

describe('BackupSchedules operation contracts through the public facade', () => {
  let api: ManageIndexesApi;
  let schedules: BackupSchedules;
  beforeEach(() => {
    jest.resetAllMocks();
    api = new ManageIndexesApi();
    jest.spyOn(api, 'createBackupSchedule').mockResolvedValue(schedule);
    jest.spyOn(api, 'listBackupSchedules').mockResolvedValue(page);
    jest.spyOn(api, 'describeBackupSchedule').mockResolvedValue(schedule);
    jest.spyOn(api, 'updateBackupSchedule').mockResolvedValue(schedule);
    jest.spyOn(api, 'deleteBackupSchedule').mockResolvedValue(undefined);
    jest.spyOn(api, 'listBackupScheduleHistory').mockResolvedValue(history);
    jest.mocked(indexOperationsBuilder).mockReturnValue(api);
    schedules = new BackupSchedules({
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

  test.each(['daily', 'weekly', 'monthly'] as const)(
    'creates a time-based %s schedule, nesting cadence and retention',
    async (frequency) => {
      await expect(
        schedules.create('source-index', {
          name: 'compliance-snapshots',
          frequency,
          retentionDays: 90,
        }),
      ).resolves.toStrictEqual(schedule);
      expect(api.createBackupSchedule).toHaveBeenCalledTimes(1);
      expect(api.createBackupSchedule).toHaveBeenCalledWith({
        indexName: 'source-index',
        createBackupScheduleRequest: {
          name: 'compliance-snapshots',
          schedule: { type: 'time-based', frequency },
          retention: { expireAfterDays: 90 },
        },
        xPineconeApiVersion: '2026-07',
      });
      // The flattened option names must not leak into the body.
      const body = jest.mocked(api.createBackupSchedule).mock.calls[0][0]
        .createBackupScheduleRequest;
      expect(body).not.toHaveProperty('retentionDays');
      expect(body).not.toHaveProperty('frequency');
    },
  );

  test.each([undefined, {}, { limit: 5, paginationToken: 'previous-page' }])(
    'lists schedules for an index with pagination options %j',
    async (options) => {
      await expect(
        schedules.list('source-index', options),
      ).resolves.toStrictEqual(page);
      expect(api.listBackupSchedules).toHaveBeenCalledTimes(1);
      expect(api.listBackupSchedules).toHaveBeenCalledWith({
        indexName: 'source-index',
        limit: options?.limit,
        paginationToken: options?.paginationToken,
        xPineconeApiVersion: '2026-07',
      });
    },
  );

  test('describes using scheduleId', async () => {
    await expect(schedules.describe('schedule-123')).resolves.toStrictEqual(
      schedule,
    );
    expect(api.describeBackupSchedule).toHaveBeenCalledTimes(1);
    expect(api.describeBackupSchedule).toHaveBeenCalledWith({
      scheduleId: 'schedule-123',
      xPineconeApiVersion: '2026-07',
    });
  });

  test.each<[UpdateBackupScheduleOptions, Record<string, unknown>]>([
    [{}, {}],
    [{ frequency: 'weekly' }, { frequency: 'weekly' }],
    [{ retentionDays: 30 }, { retention: { expireAfterDays: 30 } }],
    [{ enabled: false }, { enabled: false }],
    [
      { frequency: 'monthly', retentionDays: 7, enabled: true },
      {
        frequency: 'monthly',
        retention: { expireAfterDays: 7 },
        enabled: true,
      },
    ],
  ])(
    'updates with %j, sending only the fields given',
    async (options, body) => {
      await expect(
        schedules.update('schedule-123', options),
      ).resolves.toStrictEqual(schedule);
      expect(api.updateBackupSchedule).toHaveBeenCalledTimes(1);
      expect(api.updateBackupSchedule).toHaveBeenCalledWith({
        scheduleId: 'schedule-123',
        updateBackupScheduleRequest: body,
        xPineconeApiVersion: '2026-07',
      });
      // Omitted fields must be absent, not present as undefined, so the wire
      // body leaves them unchanged.
      expect(
        Object.keys(
          jest.mocked(api.updateBackupSchedule).mock.calls[0][0]
            .updateBackupScheduleRequest,
        ).sort(),
      ).toEqual(Object.keys(body).sort());
    },
  );

  test('deletes using scheduleId', async () => {
    await expect(schedules.delete('schedule-123')).resolves.toBeUndefined();
    expect(api.deleteBackupSchedule).toHaveBeenCalledTimes(1);
    expect(api.deleteBackupSchedule).toHaveBeenCalledWith({
      scheduleId: 'schedule-123',
      xPineconeApiVersion: '2026-07',
    });
  });

  test.each([undefined, {}, { limit: 5, paginationToken: 'previous-page' }])(
    'lists history with pagination options %j',
    async (options) => {
      await expect(
        schedules.history('schedule-123', options),
      ).resolves.toStrictEqual(history);
      expect(api.listBackupScheduleHistory).toHaveBeenCalledTimes(1);
      expect(api.listBackupScheduleHistory).toHaveBeenCalledWith({
        scheduleId: 'schedule-123',
        limit: options?.limit,
        paginationToken: options?.paginationToken,
        xPineconeApiVersion: '2026-07',
      });
    },
  );

  const createOptions = {
    name: 'compliance-snapshots',
    frequency: 'daily',
    retentionDays: 90,
  } as const;
  const invalidCalls = [
    [
      'create',
      'indexName',
      (s: BackupSchedules, value: string) => s.create(value, createOptions),
    ],
    [
      'create name',
      'name',
      (s: BackupSchedules, value: string) =>
        s.create('source-index', { ...createOptions, name: value }),
    ],
    ['list', 'indexName', (s: BackupSchedules, value: string) => s.list(value)],
    [
      'describe',
      'scheduleId',
      (s: BackupSchedules, value: string) => s.describe(value),
    ],
    [
      'update',
      'scheduleId',
      (s: BackupSchedules, value: string) =>
        s.update(value, { enabled: false }),
    ],
    [
      'delete',
      'scheduleId',
      (s: BackupSchedules, value: string) => s.delete(value),
    ],
    [
      'history',
      'scheduleId',
      (s: BackupSchedules, value: string) => s.history(value),
    ],
  ] as const;
  describe.each(invalidCalls)('%s validation', (_, field, invoke) => {
    test.each(['', undefined, null])(
      'rejects %s before calling the API',
      async (value) => {
        await expect(
          invoke(schedules, value as unknown as string),
        ).rejects.toMatchObject({
          name: 'PineconeArgumentError',
          message: expect.stringContaining(`\`${field}\``),
        });
        for (const method of [
          'createBackupSchedule',
          'listBackupSchedules',
          'describeBackupSchedule',
          'updateBackupSchedule',
          'deleteBackupSchedule',
          'listBackupScheduleHistory',
        ] as const)
          expect(api[method]).not.toHaveBeenCalled();
      },
    );
  });

  test('create rejects missing options before calling the API', async () => {
    await expect(
      schedules.create(
        'source-index',
        undefined as unknown as typeof createOptions,
      ),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message: expect.stringContaining('`name`'),
    });
    expect(api.createBackupSchedule).not.toHaveBeenCalled();
  });

  const errorCalls = [
    [
      'createBackupSchedule',
      'Error creating backup schedule for index source-index: missing',
      (s: BackupSchedules) => s.create('source-index', createOptions),
    ],
    [
      'listBackupSchedules',
      'Error listing backup schedules for index source-index: missing',
      (s: BackupSchedules) => s.list('source-index'),
    ],
    [
      'describeBackupSchedule',
      'Error describing backup schedule schedule-123: missing',
      (s: BackupSchedules) => s.describe('schedule-123'),
    ],
    [
      'updateBackupSchedule',
      'Error updating backup schedule schedule-123: missing',
      (s: BackupSchedules) => s.update('schedule-123', { enabled: false }),
    ],
    [
      'deleteBackupSchedule',
      'Error deleting backup schedule schedule-123: missing',
      (s: BackupSchedules) => s.delete('schedule-123'),
    ],
    [
      'listBackupScheduleHistory',
      'Error listing history for backup schedule schedule-123: missing',
      (s: BackupSchedules) => s.history('schedule-123'),
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
      await expect(invoke(schedules)).rejects.toEqual(
        new PineconeBadRequestError({ status: 400, message }),
      );
    },
  );
  test.each(errorCalls)(
    '%s preserves SDK errors',
    async (method, _, invoke) => {
      const error = new PineconeArgumentError('already mapped');
      jest.mocked(api[method]).mockRejectedValue(error);
      await expect(invoke(schedules)).rejects.toBe(error);
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
      await expect(invoke(schedules)).rejects.toBeInstanceOf(
        PineconeNotFoundError,
      );
    },
  );

  test.each([
    [
      'createBackupSchedule',
      (s: BackupSchedules) => s.create('source-index', createOptions),
    ],
    [
      'updateBackupSchedule',
      (s: BackupSchedules) => s.update('schedule-123', { enabled: true }),
    ],
  ] as const)(
    '%s surfaces a second enabled schedule as a conflict error',
    async (method, invoke) => {
      jest.mocked(api[method]).mockRejectedValue(
        new ResponseError(
          new Response(
            JSON.stringify({
              message: 'this index already has an enabled backup schedule',
            }),
            { status: 409 },
          ),
        ),
      );
      await expect(invoke(schedules)).rejects.toBeInstanceOf(
        PineconeConflictError,
      );
    },
  );
});
