import { PineconeConflictError, PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { getTestContext } from '../test-context';
import { randomName } from '../test-helpers';

let pinecone: Pinecone, serverlessIndexName: string;
const createdScheduleIds: string[] = [];

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  serverlessIndexName = fixtures.serverlessIndex.name;
});

afterAll(async () => {
  for (const scheduleId of createdScheduleIds) {
    try {
      await pinecone.backupSchedules.delete(scheduleId);
    } catch (e) {
      if (!(e instanceof PineconeNotFoundError)) throw e;
    }
  }
});

describe('backup schedules; serverless', () => {
  test('create, list, describe, update, history, delete lifecycle', async () => {
    const name = randomName('sched');
    const schedule = await pinecone.backupSchedules.create(
      serverlessIndexName,
      { name, frequency: 'daily', retentionDays: 7 },
    );
    createdScheduleIds.push(schedule.scheduleId);

    expect(schedule.name).toEqual(name);
    expect(schedule.scheduleType).toEqual('time-based');
    expect(schedule.frequency).toEqual('daily');
    expect(schedule.retentionExpireAfterDays).toEqual(7);
    expect(schedule.enabled).toEqual(true);
    expect(schedule.nextScheduledRun).toBeInstanceOf(Date);
    expect(schedule.createdAt).toBeInstanceOf(Date);

    const listed = await pinecone.backupSchedules.list(serverlessIndexName);
    expect(listed.data.map((s) => s.scheduleId)).toContain(schedule.scheduleId);

    const described = await pinecone.backupSchedules.describe(
      schedule.scheduleId,
    );
    expect(described.scheduleId).toEqual(schedule.scheduleId);
    expect(described.indexId).toEqual(schedule.indexId);

    // Only one enabled schedule per index.
    await expect(
      pinecone.backupSchedules.create(serverlessIndexName, {
        name: randomName('sched'),
        frequency: 'weekly',
        retentionDays: 7,
      }),
    ).rejects.toBeInstanceOf(PineconeConflictError);

    const paused = await pinecone.backupSchedules.update(schedule.scheduleId, {
      enabled: false,
    });
    expect(paused.enabled).toEqual(false);
    expect(paused.nextScheduledRun).toBeNull();
    // Cadence and retention are untouched by an enabled-only update.
    expect(paused.frequency).toEqual('daily');
    expect(paused.retentionExpireAfterDays).toEqual(7);

    const retimed = await pinecone.backupSchedules.update(schedule.scheduleId, {
      frequency: 'weekly',
      retentionDays: 3,
    });
    expect(retimed.frequency).toEqual('weekly');
    expect(retimed.retentionExpireAfterDays).toEqual(3);
    expect(retimed.enabled).toEqual(false);

    const history = await pinecone.backupSchedules.history(
      schedule.scheduleId,
      { limit: 5 },
    );
    expect(Array.isArray(history.data)).toEqual(true);
    for (const run of history.data) {
      expect(run.sourceIndexName).toEqual(serverlessIndexName);
      expect(run.backupId).toBeDefined();
    }

    await pinecone.backupSchedules.delete(schedule.scheduleId);
    await expect(
      pinecone.backupSchedules.describe(schedule.scheduleId),
    ).rejects.toBeInstanceOf(PineconeNotFoundError);
  });

  test('describe with an unknown schedule id', async () => {
    await expect(
      pinecone.backupSchedules.describe('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(PineconeNotFoundError);
  });
});
