# Bulk Import

You can [import vectors in bulk](https://docs.pinecone.io/guides/index-data/import-data) from object storage. `Import` is a long-running, asynchronous operation that imports large numbers of records into a Pinecone serverless index.

> **Note:**
>
> - `Import` only works with serverless indexes
> - `Import` is in [public preview](https://docs.pinecone.io/release-notes/feature-availability)
> - Supported object storage providers: [Amazon S3](https://docs.pinecone.io/guides/operations/integrations/integrate-with-amazon-s3), [Google Cloud Storage](https://docs.pinecone.io/guides/operations/integrations/integrate-with-google-cloud-storage), and [Azure Blob Storage](https://docs.pinecone.io/guides/operations/integrations/integrate-with-azure-blob-storage)
> - Vectors will take _at least 10 minutes_ to appear in your index upon completion of the import operation

## File format requirements

In order to import vectors from object storage, they must be stored in Parquet files and adhere to the necessary [file format](https://docs.pinecone.io/guides/index-data/import-data#prepare-your-data). Your object storage must also adhere to the necessary [directory structure](https://docs.pinecone.io/guides/index-data/import-data#prepare-your-data).

## Start an import

The following example imports vectors from an Amazon S3 bucket into a Pinecone serverless index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const indexName = 'sample-index';

// Ensure you have a serverless index
const indexModel = await pc.createIndex({
  name: indexName,
  dimension: 10,
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
});

// Get the host from the create response
const index = pc.index({ host: indexModel.host });

const storageURI = 's3://my-bucket/my-directory/';

const importResponse = await index.startImport({
  uri: storageURI,
  errorMode: 'continue', // "continue" will avoid aborting the operation if errors are encountered
});

console.log(importResponse);
// {
//   id: 'import-id'
// }
```

## Check import status

You can check the status of an import operation using `describeImport`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('sample-index');
const index = pc.index({ host: indexModel.host });

const importStatus = await index.describeImport('import-id');
console.log(importStatus);
// {
//   id: 'import-id',
//   uri: 's3://my-bucket/my-directory/',
//   status: 'InProgress',
//   createdAt: '2025-01-15T10:30:00Z',
//   percentComplete: 45,
//   recordsImported: 450000,
//   errorMessage: undefined
// }
```

## List imports

You can list all import operations for an index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('sample-index');
const index = pc.index({ host: indexModel.host });

const imports = await index.listImports();
console.log(imports);
// {
//   data: [
//     {
//       id: 'import-id-1',
//       uri: 's3://my-bucket/directory1/',
//       status: 'Completed',
//       createdAt: '2025-01-15T10:30:00Z',
//       finishedAt: '2025-01-15T12:00:00Z',
//       percentComplete: 100,
//       recordsImported: 1000000
//     },
//     {
//       id: 'import-id-2',
//       uri: 's3://my-bucket/directory2/',
//       status: 'InProgress',
//       createdAt: '2025-01-16T09:00:00Z',
//       percentComplete: 30,
//       recordsImported: 300000
//     }
//   ],
//   pagination: {
//     next: 'pagination-token'
//   }
// }

// List with pagination
const nextPage = await index.listImports({
  paginationToken: imports.pagination?.next,
});
```

## Cancel an import

You can cancel an ongoing import operation:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('sample-index');
const index = pc.index({ host: indexModel.host });

await index.cancelImport('import-id');
```

> **Note:** Canceling an import has no effect if the operation is already finished.

## Error handling

When starting an import, you can specify how errors should be handled:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('sample-index');
const index = pc.index({ host: indexModel.host });

// Continue on errors
await index.startImport({
  uri: 's3://my-bucket/my-directory/',
  errorMode: 'continue', // Continue importing even if some records fail
});

// Abort on errors
await index.startImport({
  uri: 's3://my-bucket/my-directory/',
  errorMode: 'abort', // Stop the entire import if any errors occur
});
```

## Monitoring import progress

Here's a complete example of monitoring an import until completion:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('sample-index');
const index = pc.index({ host: indexModel.host });

// Start the import
const { id } = await index.startImport({
  uri: 's3://my-bucket/my-directory/',
  errorMode: 'continue',
});

// Poll until complete
let status = 'InProgress';
while (status === 'InProgress' || status === 'Pending') {
  const importStatus = await index.describeImport(id);
  status = importStatus.status;

  console.log(
    `Import ${id}: ${status} - ${importStatus.percentComplete}% complete`,
  );

  if (status === 'InProgress' || status === 'Pending') {
    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds
  }
}

if (status === 'Completed') {
  console.log('Import completed successfully!');
} else if (status === 'Failed') {
  const importStatus = await index.describeImport(id);
  console.error(`Import failed: ${importStatus.errorMessage}`);
}
```

## Limits

See [limits](https://docs.pinecone.io/guides/index-data/import-data#import-limits) for information on import operation limits and restrictions.
