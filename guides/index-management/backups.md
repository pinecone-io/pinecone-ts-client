# Backups

> **Note:** Backups require an eligible serverless index. They are not supported for full-text search indexes with document schemas containing `full_text_search` string fields, `dense_vector` fields, or `sparse_vector` fields. Check the [backup eligibility requirements](https://docs.pinecone.io/guides/manage-data/back-up-an-index). Pod-based indexes should use [collections](./collections.md) instead.

A backup is a static, non-queryable copy of an eligible serverless index and consumes only storage. Restore it into a new serverless index, optionally with new `tags` and `deletionProtection` values. For more information, see [Backups overview](https://docs.pinecone.io/guides/manage-data/backups-overview).

The examples below create and manage on-demand backups.

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

// Check the restore job's current status; repeat until it finishes.
const restoreJob = await pc.restoreJobs.describe(response.restoreJobId);
console.log(restoreJob.status);
```

Poll with a bounded timeout while the job is `Pending`. `Completed` means the restore succeeded; `Failed` and `Cancelled` are terminal outcomes that did not complete the restore.

## Schedule recurring backups

Use `pc.backupSchedules` to back up an eligible serverless or BYOC index on a `daily`, `weekly`, or `monthly` cadence with a retention window. Only one schedule per index can be enabled at a time. The backups it produces work with the same `pc.backups` operations shown on this page.

See [Backup schedules](./backup-schedules.md) for creating a schedule, changing its frequency and retention, pausing and resuming runs, inspecting history, and deleting a schedule.

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
