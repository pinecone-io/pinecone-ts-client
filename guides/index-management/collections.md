# Collections

> **Note:** Serverless and starter indexes do not support collections.

A collection is a static snapshot of an existing pod-based index. The 2026-07 API supports creating and managing collections, but does not support creating a new index from a collection. To learn more about Pinecone collections, see [Understanding collections](https://docs.pinecone.io/guides/indexes/pods/understanding-collections).

## Create a collection

The following example creates a collection from an existing pod-based index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.collections.create({
  name: 'collection-name',
  source: 'index-name',
});
```

This API call returns quickly, but the creation of a collection can take from minutes to hours depending on the size of the source index and the index's configuration. Use `collections.describe` to check the status of a collection.

## Describe a collection

The following example describes a collection:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const collectionDescription = await pc.collections.describe('collection-name');
console.log(collectionDescription);
// {
//   name: 'collection-name',
//   size: 3126700,
//   status: 'Ready',
//   dimension: 3,
//   vectorCount: 1234,
//   environment: 'us-east1-gcp'
// }
```

## List collections

The `collections.list` command returns an object with an array of collection models:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const list = await pc.collections.list();
console.log(list);
// {
//   collections: [
//     {
//       name: 'collection1',
//       size: 3089687,
//       status: 'Ready',
//       dimension: 3,
//       vectorCount: 17378,
//       environment: 'us-west1-gcp'
//     },
//     {
//       name: 'collection2',
//       size: 208309,
//       status: 'Ready',
//       dimension: 3,
//       vectorCount: 1000,
//       environment: 'us-east4-gcp'
//     }
//   ]
// }
```

## Restoring data

The 2026-07 create-index API does not accept `sourceCollection` and cannot create new pod deployments. Do not use legacy collection-to-index creation examples with this release. The separate [backups](./backups.md) resource supports restoring an eligible backup through `pc.backups.createIndex`; a collection is not a backup ID.

## Delete a collection

The following example deletes a collection:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.collections.delete('collection-name');
```

You can use `collections.list` to confirm the deletion.
