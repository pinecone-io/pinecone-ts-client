# v1 Migration Guide

This doc will outline the differences between `v0.x` beta versions of the Pinecone client and the `v1` version. The `v1.0.0` release adds a new `Pinecone` module export alongside the legacy `PineconeClient` export. `PineconeClient` is deprecated and will be removed in a future release.

## Client Initialization

The legacy initialization has a two-step asyc initialization.

```typescript
// Legacy initialization
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.init();
```

The new client constructor accepts the same configuration object and eliminates the async `init()` step.

```typescript
// v1.0.0 initialization
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
```

Also, if you have set values for the environment variables `PINECONE_ENVIRONMENT`and `PINECONE_API_KEY` then the `Pinecone` constructor does not require any additional configuration.

```typescript
// v1.0.0 initialization
import { Pinecone } from '@pinecone-database/pinecone';

// When no config param, constructor reads from PINECONE_ENVIRONMENT and
// PINECONE_API_KEY environment variables
const pinecone = new Pinecone();
```

## Control plane

### Creating indexes

The new `Pinecone` client's `createIndex` flattens out the method params to remove the top-level `createRequest` key. It supports all the same optional configuration parameters.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.init();
await pineconeClient.createClient({
  createRequest: {
    name: 'sample-index',
    dimension: 1536,
  },
});
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.createIndex({
  name: 'sample-index',
  dimension: 1536,
});
```

### Deleting indexes

The new `Pinecone` client has flattened out the `deleteIndex` method param from an object to a string. Now you only need to pass the name of the index you would like to delete.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.init();

await client.deleteIndex({ indexName: 'index-to-delete' });
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.deleteIndex('index-to-delete');
```

### Listing indexes

The new `Pinecone` client returns an array of objects instead of an array of strings from `listIndexes()`. Returning an array of objects creates flexibility for additional data to be returned in the future without creating a breaking change.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const list = await pineconeClient.listIndexes();
// ['index-name', 'index-name2']
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
const list = await pinecone.listIndexes();
// [{ name: 'index-name' }, { name: 'index-name2' }]
```

### Describe index

The `describeIndex` method of the new `Pinecone` client has flattened the required parameters. Now you only need to pass the name of the index you would like to describe.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const indexDescription = await pineconeClient.describeIndex({
  indexName: 'index-name',
});
// {
//   database: {
//     name: 'index-name',
//     dimension: 2,
//     indexType: undefined,
//     metric: 'cosine',
//     pods: 2,
//     replicas: 2,
//     shards: 1,
//     podType: 'p1.x1',
//     indexConfig: undefined,
//     metadataConfig: { indexed: [ 'description' ] }
//   },
//   status: { ready: true, state: 'Ready' }
// }
```

The new client flattens the method params, removes deprecated response field `database.indexConfig` and adds new status fields for `status.host` and `status.port`.

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.describeIndex('test-index');
// {
//   database: {
//     name: 'test-index',
//     dimension: 10,
//     metric: 'cosine',
//     pods: 1,
//     replicas: 1,
//     shards: 1,
//     podType: 'p1.x1',
//     metadataConfig: { indexed: [Array] }
//   },
//   status: {
//     ready: true,
//     state: 'Ready',
//     host: 'test-index-c01b9b5.svc.us-east1-gcp.pinecone.io',
//     port: 433
//   }
// }
```

### Configure index

Both clients support the same configuration variables (`replicas` and `podType`), but the new `Pinecone` client has changed the signature of `configureIndex` to separate the name of the target index from the configuration that is going to change. Also, the legacy client returned empty string `''` on completion whereas the new client resolves to undefined.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.configureIndex({ indexName: 'my-index', replicas: 2 });
// ''
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.configureIndex('my-index', { replicas: 2 });
```

### Create collection

New `Pinecone` client simplifies these method params.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.createCollection({
  createCollectionRequest: { source: 'index-name', name: 'collection-name' },
});
// ''
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.createCollection({
  source: 'index-name',
  name: 'collection-name',
});
```

### Describe collection

The new `Pinecone` client simplifies method paramters to `describeCollection` and adds new data fields for `dimension` and `recordCount` in the response.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
await pineconeClient.describeCollection({ collectionName: 'collection3' });
// { name: 'collection3', size: 3126700, status: 'Ready' }
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
await pinecone.describeCollection('collection3')
{
  name: 'collection3',
  size: 3126700,
  status: 'Ready',
  dimension: 1536,
  recordCount: 99
}
```

### List collections

The new `Pinecone` client returns an array of objects instead of an array of strings from `listCollections`. Returning an array of objects creates flexibility for additional data to be returned in the future without creating a breaking change.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const list = await pineconeClient.listCollections();
// ['collection-name', 'collection-name2']
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
const list = await pinecone.listCollections();
// [{ name: 'collection-name' }, { name: 'collection-name2' }]
```

## Data plane

### Targeting an index

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');
```

In the new `Pinecone` client, the `index()` method accepts an optional generic type arument that describes the shape of your index's metadata. If you provide this type parameter, the TypeScript compiler will provide appropriate typechecking on your interactions with the `index` object when attempting to `upsert()` or `update()` and you shouldn't need to cast results of `query()` and `fetch()` operations.

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();

type MovieMetadata = {
  genre: 'comedy' | 'horror' | 'drama' | 'action' | 'other';
  runtime: number;
};
const index = await pinecone.index<MovieMetadata>('movie-embeddings');
```

### Upserting

The namespace parameter has moved out of the `upsert` method param options and been elevated into a chained `namespace()` call.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');
await index.upsert({
  upsertRequest: {
    vectors: [
      {
        id: '1',
        values: [0.1, 0.2, 0.3, 0.4],
        metadata: { genre: 'comedy', runtime: 120 },
      },
      {
        id: '2',
        values: [0.5, 0.6, 0.7, 0.8],
        metadata: { genre: 'horror', runtime: 120 },
      },
    ],
    namespace: 'imdb',
  },
});
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();

type MovieMetadata = {
  genre: 'comedy' | 'horror' | 'drama' | 'action' | 'other';
  runtime: number;
};

const index = await pinecone.index<MovieMetadata>('movie-embeddings');
const namespace = index.namespace('imdb');
await namespace.upsert([
  {
    id: '1',
    values: [0.1, 0.2, 0.3, 0.4],
    metadata: { genre: 'comedy', runtime: 120 },
  },
  {
    id: '2',
    values: [0.5, 0.6, 0, 0.8],
    metadata: { genre: 'horror', runtime: 120 },
  },
]);
```

### Fetching

In the new `Pinecone` client, namespace has been elevated from the `fetch()` method param to a chained `namespace()` call.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');
const results = await index.fetch({ ids: ['1', '2', '3'], namespace: 'imdb' });
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();

type MovieMetadata = {
  genre: 'comedy' | 'horror' | 'drama' | 'action' | 'other';
  runtime: number;
};

const index = await pinecone.index<MovieMetadata>('movie-embeddings');
const namespace = index.namespace('imdb');
const results = await namespace.fetch(['1', '2', '3']);
```

### Query

In the new `Pinecone` client, namespace has been elevated from the `query()` method param to a chained `namespace()` call. The top-level key `queryRequest` has been removed.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');
const results = await index.query({
  queryRequest: {
    topK: 1,
    vector: [...], // actual values here
    namespace: 'imdb',
    includeMetadata: true,
    includeValues: true,
    sparseVector: {
      indices: [15, 30, 11],
      values: [0.1, 0.2, 0.3],
    }
  }
});
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();

type MovieMetadata = {
  genre: 'comedy' | 'horror' | 'drama' | 'action' | 'other';
  runtime: number;
};

const index = await pinecone.index<MovieMetadata>('movie-embeddings');
const namespace = index.namespace('imdb')
const results = await index.query({
  topK: 1,
  vector: [...], // actual values here
  includeMetadata: true,
  includeValues: true,
  sparseVector: {
    indices: [15, 30, 11],
    values: [0.1, 0.2, 0.3],
  },
});
```

### Delete

In the new `Pinecone` client, there are convenience methods for `deleteOne`, `deleteMany`, `deleteAll`.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');

// Delete one record by id in namespace
await index.delete1({
  ids: ['1'],
  namespace: 'imdb',
});

// Delete several record by ids in namespace
await index.delete1({
  ids: ['1', '2', '3'],
  namespace: 'imdb',
});

// Delete all records in namespace
await index.delete1({
  deleteAll: true,
  namespace: 'imdb',
});
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
const index = await pinecone.index('movie-embeddings');
const namespace = index.namespace('imdb');

// Delete one record by id in namespace
await namespace.deleteOne('1');

// Delete several record by ids in namespace
await namespace.deleteMany(['1', '2', '3']);

// Delete all records in namespace
await namespace.deleteAll();

// Delete one record by id in default namespace
await index.deleteOne('1');

// Delete several record by ids in default namespace
await index.deleteMany(['1', '2', '3']);

// Delete all records in default namespace
await index.deleteAll();
```

### Describe index stats

The return type has changed slightly in the new `Pinecone` client. The arguments to `describeIndexStats()` have been simplified and the return type has changed `totalVectorCount` to `totalRecordCount`, `vectorCount` to `recordCount`.

```typescript
// v0.x beta releases
import { PineconeClient } from '@pinecone-database/pinecone';

const pineconeClient = new PineconeClient({
  apiKey: 'your-api-key',
  environment: 'your-environment',
});
const index = pineconeClient.Index('movie-embeddings');
const stats = await index.describeIndexStats({ describeIndexStatsRequest: {} });
// {
//   namespaces: { '': { vectorCount: 10001502 } },
//   dimension: 256,
//   indexFullness: 0.9,
//   totalVectorCount: 10001502
// }
```

```typescript
// v1.0.0
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();

const index = await pinecone.index('movie-embeddings');
const stats = await index.describeIndexStats();
// {
//   namespaces: { '': { recordCount: 10001502 } },
//   dimension: 256,
//   indexFullness: 0.9,
//   totalRecordCount: 10001502
// }
```
