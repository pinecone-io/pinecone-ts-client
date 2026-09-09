# Backup schedules

Use `pc.backupSchedules` to create recurring backups of an eligible serverless or BYOC index and retain each backup for a set number of days. Schedules support `daily`, `weekly`, and `monthly` frequencies. Only one schedule per index can be enabled at a time.

For a single snapshot before a particular change, use [on-demand backups](./backups.md). Check the supported index configurations and exclusions in [Backups](./backups.md) before creating a schedule.

## Create a schedule

Create a schedule for an existing index with a name, frequency, and retention window:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const schedule = await pc.backupSchedules.create('my-index', {
  name: 'my-daily-backup',
  frequency: 'daily',
  retentionDays: 7,
});

console.log(schedule.scheduleId, schedule.nextScheduledRun);
```

New schedules are enabled. Save the returned `scheduleId` to inspect, update, or delete the schedule. Each run names its backup after the schedule plus a timestamp.

## List and inspect schedules

Schedules are listed per index, including enabled and disabled schedules. Pass `pagination.next` as `paginationToken` to retrieve the next page:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const page = await pc.backupSchedules.list('my-index', { limit: 10 });
for (const schedule of page.data) {
  console.log(schedule.scheduleId, schedule.enabled, schedule.nextScheduledRun);
}

if (page.pagination?.next) {
  const nextPage = await pc.backupSchedules.list('my-index', {
    limit: 10,
    paginationToken: page.pagination.next,
  });
  console.log(nextPage.data);
}
```

Retrieve one schedule by its ID to see the current configuration and next planned run:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const schedule = await pc.backupSchedules.describe('YOUR_SCHEDULE_ID');
console.log(schedule.frequency, schedule.retentionExpireAfterDays);
console.log(schedule.enabled, schedule.nextScheduledRun);
```

The creation and update option is `retentionDays`; the returned schedule reports that value as `retentionExpireAfterDays`. `nextScheduledRun` is a `Date` when enabled and `null` when disabled.

## Update, pause, and resume

Use `update` to change the frequency, retention, or enabled state. Omitted fields keep their existing values; the schedule name and source index cannot be changed. Changing `retentionDays` also changes the expiry of backups the schedule has already produced.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const scheduleId = 'YOUR_SCHEDULE_ID';

const paused = await pc.backupSchedules.update(scheduleId, { enabled: false });
console.log(paused.nextScheduledRun); // null

await pc.backupSchedules.update(scheduleId, {
  frequency: 'weekly',
  retentionDays: 30,
});

const resumed = await pc.backupSchedules.update(scheduleId, { enabled: true });
console.log(resumed.nextScheduledRun);
```

Pausing stops scheduled runs. Re-enabling a paused schedule starts a backup immediately and computes the next run from the time of the update.

## Inspect backup history and restore

History includes backups produced or planned by a schedule. A backup in `Scheduled` status has not run yet; its `scheduledExecutionAt` gives the planned time.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const scheduleId = 'YOUR_SCHEDULE_ID';

const page = await pc.backupSchedules.history(scheduleId, { limit: 10 });
for (const backup of page.data) {
  console.log(backup.backupId, backup.status, backup.scheduledExecutionAt);
}

if (page.pagination?.next) {
  const nextPage = await pc.backupSchedules.history(scheduleId, {
    limit: 10,
    paginationToken: page.pagination.next,
  });
  console.log(nextPage.data);
}
```

Scheduled backups are ordinary backups: inspect one with `pc.backups.describe(backupId)`, or use `pc.backups.listByIndex(indexName)` to include both scheduled and on-demand backups. Once a backup is `Ready`, pass its `backupId` to `pc.backups.createIndex` to restore it into a new index. See [Create a new index from a backup](./backups.md#create-a-new-index-from-a-backup) for the restore request and restore job tracking.

## Delete a schedule

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.backupSchedules.delete('YOUR_SCHEDULE_ID');
```

Deleting a schedule stops future runs. Existing backups remain until their retention window ends. To remove an individual backup, use [`pc.backups.delete`](./backups.md#delete-backups).
