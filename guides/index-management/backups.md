# Backups

> **Note:** Backups are only supported for serverless indexes. Pod-based indexes should use [collections](./collections.md) instead.

A backup is a static copy of a serverless index that only consumes storage. It is a non-queryable representation of a set of records. You can create a backup of a serverless index, and you can create a new serverless index from a backup. You can optionally apply new `tags` and `deletionProtection` configurations to the index. For more information, see [Understanding backups](https://docs.pinecone.io/guides/indexes/understanding-backups).

## Create a backup

You can create a new backup from an existing index using the index name:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const backup = await pc.createBackup({
  indexName: 'my-index',
  name: 'my-index-backup-1',
  description: 'weekly backup',
});

console.log(backup);
// {
//   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
//   sourceIndexName: 'my-index',
//   sourceIndexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
//   name: 'my-index-backup-1',
//   description: 'weekly backup',
//   status: 'Initializing',
//   cloud: 'aws',
//   region: 'us-east-1',
//   dimension: 1024,
//   metric: 'cosine',
//   recordCount: 500,
//   namespaceCount: 4,
//   sizeBytes: 78294,
//   tags: {},
//   createdAt: '2025-05-07T03:11:11.722238160Z'
// }
```

## Create a new index from a backup

You can restore a serverless index by creating a new index from a backup. Optionally, you can provide new `tags` or `deletionProtection` values when restoring an index. Creating an index from a backup initiates a new restore job, which can be used to view the progress of the index restoration through `describeRestoreJob`.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const response = await pc.createIndexFromBackup({
  backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
  name: 'my-index-restore-1',
});

console.log(response);
// {
//   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
//   indexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe'
// }
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

You can use a `backupId` and the `describeBackup` method to describe a specific backup:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const backup = await pc.describeBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
console.log(backup);
// {
//   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
//   sourceIndexName: 'my-index',
//   sourceIndexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
//   name: 'my-index-backup-1',
//   description: 'weekly backup',
//   status: 'Ready',
//   cloud: 'aws',
//   region: 'us-east-1',
//   dimension: 1024,
//   metric: 'cosine',
//   recordCount: 500,
//   namespaceCount: 4,
//   sizeBytes: 78294,
//   tags: {},
//   createdAt: '2025-05-07T03:11:11.722238160Z'
// }
```

## List backups

`listBackups` lists all the backups for a specific index, or your entire project. If an `indexName` is provided, only the backups for that index will be listed.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// List backups for the entire project
const projectBackups = await pc.listBackups({ limit: 2 });

// List backups for a specific index
const myIndexBackups = await pc.listBackups({
  indexName: 'my-index',
  limit: 2,
});

console.log(myIndexBackups);
// {
//   data: [
//     {
//       backupId: '6a00902c-d118-4ad3-931c-49328c26d558',
//       sourceIndexName: 'my-index',
//       sourceIndexId: '0888b4d9-0b7b-447e-a403-ab057ceee4d4',
//       name: 'my-index-backup-2',
//       description: undefined,
//       status: 'Ready',
//       cloud: 'aws',
//       region: 'us-east-1',
//       dimension: 5,
//       metric: 'cosine',
//       recordCount: 200,
//       namespaceCount: 2,
//       sizeBytes: 67284,
//       tags: {},
//       createdAt: '2025-05-07T18:34:13.626650Z'
//     },
//     {
//       backupId: '2b362ea3-b7cf-4950-866f-0dff37ab781e',
//       sourceIndexName: 'my-index',
//       sourceIndexId: '0888b4d9-0b7b-447e-a403-ab057ceee4d4',
//       name: 'my-index-backup-1',
//       description: undefined,
//       status: 'Ready',
//       cloud: 'aws',
//       region: 'us-east-1',
//       dimension: 1024,
//       metric: 'cosine',
//       recordCount: 500,
//       namespaceCount: 4,
//       sizeBytes: 78294,
//       tags: {},
//       createdAt: '2025-05-07T18:33:59.888270Z'
//     }
//   ],
//   pagination: undefined
// }
```

## Describe and list restore jobs

You can use a `restoreJobId` and the `describeRestoreJob` method to describe a specific restore job:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const restoreJob = await pc.describeRestoreJob(
  '4d4c8693-10fd-4204-a57b-1e3e626fca07',
);

console.log(restoreJob);
// {
//   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
//   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
//   targetIndexName: 'my-index-restore-1',
//   targetIndexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe',
//   status: 'Completed',
//   createdAt: '2025-05-07T03:38:37.107Z',
//   completedAt: '2025-05-07T03:40:23.687Z',
//   percentComplete: 100
// }
```

`listRestoreJobs` lists all the restore jobs for your project:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const projectRestoreJobs = await pc.listRestoreJobs({ limit: 3 });
console.log(projectRestoreJobs);
// {
//   data: [
//     {
//       restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
//       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
//       targetIndexName: 'my-index-restore-1',
//       targetIndexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe',
//       status: 'Completed',
//       createdAt: '2025-05-07T03:38:37.107Z',
//       completedAt: '2025-05-07T03:40:23.687Z',
//       percentComplete: 100
//     },
//     // ... more restore jobs
//   ],
//   pagination: undefined
// }
```

## Delete backups

You can delete a backup using the backupId and `deleteBackup`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.deleteBackup('6a00902c-d118-4ad3-931c-49328c26d558');
```
