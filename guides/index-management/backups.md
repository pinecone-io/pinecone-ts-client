# Backups

> **Note:** Backups are only supported for serverless indexes. Pod-based indexes should use [collections](./collections.md) instead.

A backup is a static copy of a serverless index that only consumes storage. It is a non-queryable representation of a set of records. You can create a backup of a serverless index, and you can create a new serverless index from a backup. You can optionally apply new `tags` and `deletionProtection` configurations to the index. For more information, see [Understanding backups](https://docs.pinecone.io/guides/indexes/understanding-backups).

## Create a backup

You can create a new backup from an existing index using the index name:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const backup = await pc.backups.create('my-index', {
  name: 'my-index-backup-1',
  description: 'weekly backup',
});

console.log(backup);
```

## Create a new index from a backup

You can restore a serverless index by creating a new index from a backup. Optionally, you can provide new `tags` or `deletionProtection` values when restoring an index. Creating an index from a backup initiates a new restore job, which can be used to view the progress of the index restoration through `pc.restoreJobs.describe`.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const response = await pc.backups.createIndex(
  '11450b9f-96e5-47e5-9186-03f346b1f385',
  {
    name: 'my-index-restore-1',
  },
);

console.log(response);
```

## Schedule recurring backups

A backup schedule backs up a serverless or BYOC index on a fixed cadence (`daily`, `weekly`, or `monthly`) and keeps each backup for a set number of days. Only one schedule per index can be enabled at a time. The backups it produces are ordinary backups, so `pc.backups.describe` and `pc.backups.listByIndex` work on them too.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const schedule = await pc.backupSchedules.create('my-index', {
  name: 'compliance-snapshots',
  frequency: 'daily',
  retentionDays: 90,
});

console.log(schedule);
// {
//   scheduleId: 'e88f7273-42aa-47e9-af73-593827136867',
//   name: 'compliance-snapshots',
//   indexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
//   projectId: '7f1c2a9e-3b4d-4c5e-8f6a-1b2c3d4e5f60',
//   scheduleType: 'time-based',
//   frequency: 'daily',
//   retentionExpireAfterDays: 90,
//   enabled: true,
//   nextScheduledRun: 2026-04-03T06:00:00.000Z,
//   createdAt: 2026-04-02T14:12:09.000Z
// }
```

Schedules are listed per index. Pass the `scheduleId` to describe, update, or delete one, or to list the backups it has produced:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const schedules = await pc.backupSchedules.list('my-index');
const scheduleId = schedules.data[0].scheduleId;

// Pause the schedule; nextScheduledRun becomes null until it is re-enabled.
await pc.backupSchedules.update(scheduleId, { enabled: false });

// Change the cadence and retention window. Omitted fields are left unchanged.
await pc.backupSchedules.update(scheduleId, {
  frequency: 'weekly',
  retentionDays: 30,
});

// Backups the schedule has produced or planned. A row with status
// 'Scheduled' has not run yet.
const runs = await pc.backupSchedules.history(scheduleId, { limit: 10 });
for (const run of runs.data) {
  console.log(run.backupId, run.status, run.scheduledExecutionAt);
}

// Stop future runs. Backups already taken stay until their retention ends.
await pc.backupSchedules.delete(scheduleId);
```

## Describe a backup

The 2026-07 backup model describes its fields under `schema`; it does not return legacy top-level `dimension` and `metric` fields.

You can use a `backupId` and the `pc.backups.describe` method to describe a specific backup:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const backup = await pc.backups.describe(
  '11450b9f-96e5-47e5-9186-03f346b1f385',
);
console.log(backup);
```

## List backups

`pc.backups.list()` lists backups for your entire project. Use `pc.backups.listByIndex(indexName, options)` to list backups for one index.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// List backups for the entire project
const projectBackups = await pc.backups.list({ limit: 2 });

// List backups for a specific index
const myIndexBackups = await pc.backups.listByIndex('my-index', {
  limit: 2,
});

console.log(myIndexBackups);
```

## Describe and list restore jobs

You can use a `restoreJobId` and the `pc.restoreJobs.describe` method to describe a specific restore job:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const restoreJob = await pc.restoreJobs.describe(
  '4d4c8693-10fd-4204-a57b-1e3e626fca07',
);

console.log(restoreJob);
```

`pc.restoreJobs.list` lists all the restore jobs for your project:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const projectRestoreJobs = await pc.restoreJobs.list({ limit: 3 });
console.log(projectRestoreJobs);
```

## Delete backups

You can delete a backup using the backupId and `pc.backups.delete`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.backups.delete('6a00902c-d118-4ad3-931c-49328c26d558');
```
