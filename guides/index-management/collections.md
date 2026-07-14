# Collections

> **Note:** Serverless and starter indexes do not support collections.

A collection is a static copy of a pod-based index that may be used to create backups, to create copies of indexes, or to perform experiments with different index configurations. To learn more about Pinecone collections, see [Understanding collections](https://docs.pinecone.io/guides/indexes/pods/understanding-collections).

## Create a collection

The following example creates a collection from an existing pod-based index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createCollection({
  name: 'collection-name',
  source: 'index-name',
});
```

This API call returns quickly, but the creation of a collection can take from minutes to hours depending on the size of the source index and the index's configuration. Use `describeCollection` to check the status of a collection.

## Describe a collection

The following example describes a collection:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const collectionDescription = await pc.describeCollection('collection-name');
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

The `listCollections` command returns an object with an array of collection models:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const list = await pc.listCollections();
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

## Create an index from a collection

Given that you have an existing collection, you can create a new pod-based index from it. Note that for pod-based indexes, you can specify a `sourceCollection` from which to create an index. The collection must be in the same environment as the index.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'product-description-p1x1',
  dimension: 256,
  metric: 'cosine',
  spec: {
    pod: {
      environment: 'us-east4-gcp',
      pods: 1,
      podType: 'p1.x1',
      sourceCollection: 'product-description-embeddings',
    },
  },
});
```

When the new index is ready, it should contain all the data that was in the collection, ready to be queried.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.describeIndex('product-description-p1x1');
const index = pc.index({ host: indexModel.host });
const stats = await index.describeIndexStats();
console.log(stats);
// {
//   namespaces: { '': { recordCount: 78000 } },
//   dimension: 256,
//   indexFullness: 0.9,
//   totalRecordCount: 78000
// }
```

## Delete a collection

The following example deletes a collection:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.deleteCollection('collection-name');
```

You can use `listCollections` to confirm the deletion.
