# Pinecone Node.js Client &middot; ![License](https://img.shields.io/github/license/pinecone-io/pinecone-ts-client?color=orange) ![npm](https://img.shields.io/npm/v/%40pinecone-database%2Fpinecone?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40pinecone-database%2Fpinecone) ![npm](https://img.shields.io/npm/dw/%40pinecone-database/pinecone?style=flat&color=blue&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40pinecone-database%2Fpinecone) ![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/pinecone-io/pinecone-ts-client/merge.yml?label=CI&link=https%3A%2F%2Fgithub.com%2Fpinecone-io%2Fpinecone-ts-client%2Factions%2Fworkflows%2Fmerge.yml)

This is the official Node.js client for [Pinecone](https://www.pinecone.io), written in TypeScript.

## Documentation

- [**Reference Documentation**](https://pinecone-io.github.io/pinecone-ts-client/classes/Pinecone.html)
- If you are upgrading from a `v0.x` beta client, check out the [**v1 Migration Guide**](https://github.com/pinecone-io/pinecone-ts-client/blob/main/v1-migration.md).

### Example code

Many of the brief examples shown in this README are using very small vectors to keep this documentation concise, but most real world usage will involve much larger embedding vectors. To see some more realistic examples of how this client can be used, explore these examples:

- [Semantic search](https://github.com/pinecone-io/semantic-search-example)
- [Article recommender](https://github.com/pinecone-io/recommender-example-typescript)
- [Image search](https://github.com/pinecone-io/image-search-example)

## Prerequisites

The Pinecone TypeScript client is compatible with TypeScript 4.1 and greater.

## Installation

```
npm install @pinecone-database/pinecone
```

## Usage

### Initializing the client

There are two pieces of configuration required to use the Pinecone client: an API key and environment value. These values can be passed using environment variables or in code through a configuration object. Find your configuration values in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io).

#### Using environment variables

The environment variables used to configure the client are the following:

```bash
PINECONE_API_KEY="your_api_key"
PINECONE_ENVIRONMENT="your_environment"
```

When these environment variables are set, the client constructor does not require any additional arguments.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
```

#### Using a configuration object

If you prefer to pass configuration in code, the constructor accepts a config object containing the `apiKey` and `environment` values. This
could be useful if your application needs to interact with multiple projects, each with a different configuration.

```typescript
const pinecone = new Pinecone({
  apiKey: 'your_api_key',
  environment: 'your_environment',
});
```

## Indexes

### Create Index

#### Create an index with minimal configuration

At a minimum, to create an index you must specify a `name` and `dimension`. The `dimension` indicates the size of the records you intend to store in the index. For example, if your intention was to store and query embeddings generated with OpenAI's [textembedding-ada-002](https://platform.openai.com/docs/guides/embeddings/second-generation-models) model, you would need to create an index with dimension `1536` to match the output of that model.

```typescript
const pinecone = new Pinecone();
await pinecone.createIndex({
  name: 'sample-index',
  dimension: 1536,
});
```

#### Create an index with other optional configurations

Many optional configuration fields allow greater control over hardware resources and availability. To learn more
about the purpose of these fields, see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
and [Scaling indexes](https://docs.pinecone.io/docs/scaling-indexes).

```typescript
await pinecone.createIndex({
  name: 'sample-index-2',
  dimension: 1536,
  metric: 'dotproduct',
  pods: 2,
  replicas: 2,
  shards: 2,
  podType: 'p1.x2',
  metadataConfig: {
    indexed: ['product_type'],
  },

  // This option tells the client not to throw if the index already exists.
  suppressConflicts: true,

  // This option tells the client not to resolve the promise until the
  // index is ready.
  waitUntilReady: true,
});
```

#### Checking the status of a newly created index

The `createIndex` method issues a create request to the API that returns quickly, but the resulting index is
not immediately ready for upserting, querying, or performing other data operations. You can use the
`describeIndex` method to find out the status of an index and see whether it is ready for use.

```typescript
> await pinecone.describeIndex('sample-index')
{
  database: {
    name: 'sample-index',
    dimension: 1536,
    metric: 'cosine',
    pods: 1,
    replicas: 1,
    shards: 1,
    podType: 'p1.x1'
  },
  status: {
    ready: false,
    state: 'Initializing',
    host: 'sample-index-c01b9b5.svc.us-east1-gcp.pinecone.io',
    port: 433
  }
}
> await pinecone.describeIndex('sample-index')
{
  database: {
    name: 'sample-index',
    dimension: 1536,
    metric: 'cosine',
    pods: 1,
    replicas: 1,
    shards: 1,
    podType: 'p1.x1'
  },
  status: {
    ready: true,
    state: 'Ready',
    host: 'sample-index-c01b9b5.svc.us-east1-gcp.pinecone.io',
    port: 433
  }
}
```

#### Waiting until the index is ready

If you pass the `waitUntilReady` option, the client will handle polling for status updates on a newly created index. The promise returned by `createIndex` will not be resolved until the index status indicates it is ready to handle data operations. This can be especially useful for integration testing, where index creation in a setup step will be immediately followed by data operations.

```typescript
const pinecone = new Pinecone();
await pinecone.createIndex({
  name: 'sample-index',
  dimension: 1536,
  waitUntilReady: true,
});
```

#### Create an index from a Pinecone collection

As you use Pinecone for more things, you may wish to explore different index configurations with the same vector data. [Collections](https://docs.pinecone.io/docs/collections) provide an easy way to do this. See other client methods for working with collections [here](https://github.com/pinecone-io/pinecone-ts-client#collections).

Given that you have an existing collection:

```typescript
> await pinecone.describeCollection('product-description-embeddings')
{
  name: 'product-description-embeddings',
  size: 543427063,
  status: 'Ready',
  dimension: 2,
  recordCount: 10001498
}
```

You can specify a sourceCollection along with other configuration in your `createIndex` options:

```typescript
await pinecone.createIndex({
  name: 'product-description-p1x1',
  sourceCollection: 'product-description-embeddings',
  dimension: 256,
  metric: 'cosine'
  podType: 'p1.x1'
})
```

When the new index is ready, it should contain all the data that was in the collection, ready to be queried.

```typescript
> await pinecone.index('product-description-p2x2').describeIndexStats()
{
  namespaces: { '': { recordCount: 78000 } },
  dimension: 256,
  indexFullness: 0.9,
  totalRecordCount: 78000
}
```

### Describe Index

You can fetch the description of any index by name using `describeIndex`.

```typescript
> await pinecone.describeIndex('sample-index')
{
  database: {
    name: 'sample-index',
    dimension: 1536,
    metric: 'cosine',
    pods: 1,
    replicas: 1,
    shards: 1,
    podType: 'p1.x1'
  },
  status: {
    ready: true,
    state: 'Ready',
    host: 'sample-index-c01b9b5.svc.us-east1-gcp.pinecone.io',
    port: 433
  }
}
```

### Configure Index

You can adjust the number of replicas or scale to a larger pod size (specified with `podType`). See [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes). You cannot downgrade pod size or change the base pod type.

```typescript
> await pinecone.configureIndex('my-index', { replicas: 3 })
> const config = await pinecone.describeIndex('my-index')
{
  database: {
    name: 'my-index',
    dimension: 2,
    metric: 'cosine',
    pods: 2,
    replicas: 2,
    shards: 1,
    podType: 'p1.x1'
  },
  status: {
    ready: true,
    state: 'ScalingUpPodSize',
    host: 'my-index-c01b9b5.svc.us-east1-gcp.pinecone.io',
    port: 433
  }
}
```

### Delete Index

Indexes are deleted by name.

```typescript
await pinecone.deleteIndex('sample-index');
```

### List Indexes

The `listIndexes` command returns an array of index names.

```typescript
> await pinecone.listIndexes()
[{ name: 'sample-index' }, { name: 'sample-index-2' }]
```

## Collections

A collection is a static copy of an index that may be used to create backups, to create copies of indexes, or to perform experiments with different index configurations. To learn more about Pinecone collections, see [Understanding collections](https://docs.pinecone.io/docs/collections).

### Create Collection

```typescript
await pinecone.createCollection({
  name: 'collection-name',
  source: 'index-name',
});
```

This API call should return quickly, but the creation of a collection can take from minutes to hours depending on the size of the source index and the index's configuration. Use `describeCollection` to check the status of a collection.

### Delete Collection

```typescript
await pinecone.deleteCollection('collection-name');
```

You can use `listIndexes` to confirm the deletion.

### Describe Collection

```typescript
> const describeCollection = await pinecone.describeCollection('collection3');
{
  name: 'collection3',
  size: 3126700,
  status: 'Ready',
  dimension: 3,
  recordCount: 99
}
```

### List Collections

```typescript
> const list = await pinecone.listCollections();
[{ name: "collection1" }, { name: "collection2" }]
```

## Index operations

Pinecone indexes support operations for working with vector data using operations such as upsert, query, fetch, and delete.

### Targeting an index

To perform data operations on an index, you target it using the `index` method.

```typescript
const pinecone = new Pinecone();
const index = pinecone.index('test-index');

// Now perform index operations
await index.fetch(['1']);
```

### Targeting an index, with metadata typing

If you are storing metadata alongside your vector values, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking.

```typescript
const pinecone = new Pinecone();

type MovieMetadata = {
  title: string,
  runtime: numbers,
  genre: 'comedy' | 'horror' | 'drama' | 'action'
}

// Specify a custom metadata type while targeting the index
const index = pinecone.index<MovieMetadata>('test-index');

// Now you get type errors if upserting malformed metadata
await index.upsert([{
  id: '1234',
  values: [
    .... // embedding values
  ],
  metadata: {
    genre: 'Gone with the Wind',
    runtime: 238,
    genre: 'drama',
    // @ts-expect-error because category property not in MovieMetadata
    category: 'classic'
  }
}])

const results = await index.query({
  vector: [
    ... // query embedding
  ],
  filter: { genre: { '$eq': 'drama' }}
})
const movie = results.matches[0];

if (movie.metadata) {
  // Since we passed the MovieMetadata type parameter above,
  // we can interact with metadata fields without having to
  // do any typecasting.
  const { title, runtime, genre } = movie.metadata;
  console.log(`The best match in drama was ${title}`)
}
```

### Targeting a namespace

> [!NOTE]
> Indexes in the [gcp-starter environment](https://docs.pinecone.io/docs/starter-environment) do not support namespaces.

By default, all data operations take place inside the default namespace of `''`. If you are working with other non-default namespaces, you can target the namespace by chaining a call to `namespace()`.

```typescript
const pinecone = new Pinecone();
const index = pinecone.index('test-index').namespace('ns1');

// Now perform index operations in the targeted index and namespace
await index.fetch(['1']);
```

If needed, you can check the currently targeted index and namespace by inspecting the `target` property of an index object.

```typescript
const pinecone = new Pinecone();
const index = pinecone.index('test-index').namespace('ns1');

console.log(index.target); // { index: 'test-index', namespace: 'ns1' }
```

See [Using namespaces](https://docs.pinecone.io/docs/namespaces) for more information.

### Upsert records

Pinecone expects records inserted into indexes to have the following form:

```typescript
type PineconeRecord = {
  id: string;
  values: Array<number>;
  sparseValues?: Array<number>;
  metadata?: object;
};
```

To upsert some records, you can use the client like so:

```typescript
const pinecone = new Pinecone();

// Target an index
const index = pinecone.index('sample-index');

// Prepare your data. The length of each array
// of vector values must match the dimension of
// the index where you plan to store them.
const records = [
  {
    id: '1',
    values: [0.236, 0.971, 0.559],
  },
  {
    id: '2',
    values: [0.685, 0.111, 0.857],
  },
];

// Upsert the data into your index
await index.upsert(records);
```

### Seeing index statistics

When experimenting with data operations, it's sometimes helpful to know how many records are stored in each namespace. In that case,
target the index and use the `describeIndexStats()` command.

```typescript
> await pinecone.index('example-index').describeIndexStats()
{
  namespaces: {
    '': { recordCount: 10 }
    foo: { recordCount: 2000 },
    bar: { recordCount: 2000 }
  },
  dimension: 1536,
  indexFullness: 0,
  totalRecordCount: 4010
}
```

### Querying

#### Querying with vector values

The query method accepts a large number of options. The dimension of the query vector must match the dimension of your index.

```typescript
type QueryOptions = {
  topK: number; // number of results desired
  vector?: Array<number>; // must match dimension of index
  sparseVector?: {
    indices: Array<integer>; // indices must fall within index dimension
    values: Array<number>; // indices and values arrays must have same length
  };
  id?: string;
  includeMetadata: boolean;
  includeValues: boolean;
};
```

For example, to query by vector values you would pass the `vector` param in the options configuration. For brevity sake this example query vector is tiny (dimension 2), but in a more realistic use case this query vector would be an embedding outputted by a model. Look at the [Example code](#example-code) to see more realistic examples of how to use `query`.

```typescript
> await pinecone.index('my-index').query({ topK: 3, vector: [ 0.22, 0.66 ]})
{
  matches: [
    {
      id: '556',
      score: 1.00000012,
      values: [],
      sparseValues: undefined,
      metadata: undefined
    },
    {
      id: '137',
      score: 1.00000012,
      values: [],
      sparseValues: undefined,
      metadata: undefined
    },
    {
      id: '129',
      score: 1.00000012,
      values: [],
      sparseValues: undefined,
      metadata: undefined
    }
  ],
  namespace: ''
}
```

You include options to `includeMetadata: true` or `includeValues: true` if you need this information. By default these are not returned to keep the response payload small.

Remember that data operations take place within the context of a namespace, so if you are working with namespaces and do not see expected results you should check that you are targeting the correct namespace with your query.

```typescript
const results = await pinecone
  .index('my-index')
  .namespace('my-namespace')
  .query({ topK: 3, vector: [0.22, 0.66] });
```

#### Querying by record id

You can query using the vector values of an existing record in the index by passing a record id.

```typescript
const results = await pinecone.index('my-index').query({ topK: 10, id: '1' });
```

#### Hybrid search with sparseVector

If you are working with [sparse-dense vectors](https://docs.pinecone.io/docs/hybrid-search#creating-sparse-vector-embeddings), you can add sparse vector values to perform a hybrid search.

```typescript
const pinecone = new Pinecone()

await pinecone.createIndex({
  name: 'hyrbid-image-search',
  metric: 'dotproduct',
  dimension: 512,
  podType: 's1',
  waitUntilReady: true
});
const index = pinecone.index('hybrid-image-search');

// Create some vector embeddings using your model of choice.
const records = [...]

// Upsert data
await index.upsert(records)

// Prepare query values. In a more realistic example, these would both come out of a model.
const vector = [
  // The dimension of this index needs to match the index dimension.
  // Pretend this is a 512 dimension vector.
]
const sparseVector = {
  indices: [23, 399, 251, 17],
  values: [ 0.221, 0.967, 0.016, 0.572]
}

// Execute the query
const results = await index.query({ topK: 10, vector, sparseVector, includeMetadata: true })
```

### Update a record

You may want to update vector `values`, `sparseValues`, or `metadata`. Specify the id and the attribute value you want to update.

```typescript
await pinecone.index('imdb-movies').update({
  id: '18593',
  metadata: { genre: 'romance' },
});
```

### Fetch records by their IDs

```typescript
const fetchResult = await index.fetch(['id-1', 'id-2']);
```

### Delete records

For convenience there are several delete-related methods. You can verify the results of a delete operation by trying to `fetch()` a record or looking at the index summary with `describeIndexStats()`

#### Delete one

```typescript
const index = pinecone.index('my-index');
await index.deleteOne('id-to-delete');
```

#### Delete many by id

```typescript
const index = pinecone.index('my-index');
await index.deleteMany(['id-1', 'id-2', 'id-3']);
```

### Delete many by metadata filter

```typescript
await client.index('albums-database').deleteMany({ genre: 'rock' });
```

#### Delete all records in a namespace

> [!NOTE]
> Indexes in the [gcp-starter environment](https://docs.pinecone.io/docs/starter-environment) do not support namespaces.

To nuke everything in the targeted namespace, use the `deleteAll` method.

```typescript
const index = pinecone.index('my-index');
await index.namespace('foo-namespace').deleteAll();
```

If you do not specify a namespace, the records in the default namespace `''` will be deleted.

## Productionizing

If you are ready to take a JavaScript application to production where raw performance is the overriding concern, you can set the environment variable `PINECONE_DISABLE_RUNTIME_VALIDATIONS="true"` to disable runtime argument validation in the Pinecone client. Runtime validations are used to provide feedback when incorrect method options are provided, for example if you attempt to create an index without specifying a required dimension property.

These runtime validations are most helpful for users who are not developing with Typescript or who are experimenting in a REPL or notebook-type setting. But once you've tested an application and have gained confidence things are working as expected, you can disable these checks to gain a small improvement in performance. This will have the most impact if your workload is upserting very large amounts of data.

## Legacy exports

For information about the legacy `PineconeClient` export, see the [old README](https://github.com/pinecone-io/pinecone-ts-client/blob/main/README.v0.md).
