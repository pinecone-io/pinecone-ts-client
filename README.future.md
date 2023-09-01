# README: Upcoming v1 client

**This README is a draft related to an upcoming release of the node pinecone client. Everything in this document is subject to change.**

# Pinecone Node.js Client

This is the official Node.js client for Pinecone, written in TypeScript.

[![Tests](https://github.com/pinecone-io/pinecone-ts-client/actions/workflows/pr.yml/badge.svg?branch=main)](https://github.com/pinecone-io/pinecone-ts-client/actions/workflows/PR.yml)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/pinecone-io/pinecone-ts-client/graphs/commit-activity)

## Installation

```
npm install @pinecone-database/pinecone
```

## Usage

### Initializing the client

There are two pieces of configuration required to use the Pinecone client: an API key and environment value. These values can be passed using environment variables or in code through a configuration object. Find your configuration values in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io).

#### Using environment variables

The environment variables used to configure the client are:

```bash
PINECONE_API_KEY="your_api_key"
PINECONE_ENVIRONMENT="your_environment"
```

When these environment variables are set, the client constructor does not require any additional arguments.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
```

#### Using configuration object

If you prefer to pass configuration in code, the constructor accepts a config object containing the apiKey and environment values. This
could be useful if your application needs to interact with multiple projects each with different configuration.

```typescript
const pinecone = new Pinecone({
  apiKey: 'your_api_key',
  environment: 'your_environment',
});
```

## Control plane operations

Once you've instantiated your pinecone client, you're ready to perform the following control plane operations:

1. Create, configure and delete indexes
2. Get information about existing indexes
3. Create and delete collections
4. Select an index to perform data operations (upsert, query, fetch, etc)

## Indexes

### Create Index with minimal configuration

At a minimum, to create an index you must specify a `name` and `dimension`. The `dimension` indicates the size of the records you intend to store in the index. For example, if your intention was to store and query embeddings generated with OpenAI's [textembedding-ada-002](https://platform.openai.com/docs/guides/embeddings/second-generation-models) model, you would need to create an index with dimension `1536` to match the output of that model.

```typescript
const pinecone = new Pinecone();
await pinecone.createIndex({
  name: 'sample-index',
  dimension: 1536,
});
```

#### Create index with other optional configurations

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
});
```

#### Create Index: Checking the status of a newly created index

The `createIndex` method issues a create request to the API that returns quickly, but the resulting index is
not immediately ready for use upserting, querying, or performing other data operations. You can use the
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
  status: { ready: false, state: 'Initializing' }
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

#### Create Index: Waiting until the index is ready

If you pass the `waitUntilReady` option, the client will handle polling for status updates on a newly created index. The promise returned by `createIndex` will not be resolved until the index status indicates it is ready to handle data operations. This can be especially useful for integration testing where index creation in a setup step will be immediately followed by data operations.

```typescript
const client = new Pinecone();
await pinecone.createIndex({
  name: 'sample-index',
  dimension: 1536,
  waitUntilReady: true,
});
```

#### Create index from a Pinecone collection

As you use Pinecone for more things, you may wish to explore different index configurations with the same vector data. Collections provide an easy way to do this.

Given that you have an existing collection:

```typescript
> await pinecone.describeCollection('product-description-embeddings')
{
  name: 'product-description-embeddings',
  size: 543427063,
  status: 'Ready',
  dimension: 2,
  vectorCount: 10001498
}
```

You can specify a sourceCollection along with other configuration in your create index options:

```typescript
await pinecone.createIndex({
  name: 'product-description-p1x1',
  sourceCollection: 'product-description-embeddings',
  dimension: 256,
  metric: 'cosine'
  podType: 'p1.x1'
})
```

When the new index is ready, it should contain all the data that was in the collection ready to be queried.

```typescript
> await pinecone.index('product-description-p2x2').describeIndexStats()
{
  namespaces: { '': { vectorCount: 78000 } },
  dimension: 256,
  indexFullness: 0.9,
  totalVectorCount: 78000
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
  status: { ready: true, state: 'Ready' }
}
```

### Configure Index

You can adjust the number of replicas or scale to a larger pod size (specified with podType). See [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes). You cannot downgrade pod size or change the base pod type.

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
    host: 'jen2-c01b9b5.svc.us-east1-gcp.pinecone.io',
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

The list index command returns an array of index names.

```typescript
> await pinecone.listIndexes()
[ 'sample-index', 'sample-index-2' ]
```

## Collections

A collection is a static copy of an index that may be used for backup, to create copies of indexes, or perform experiments with different index configurations. To learn more about Pinecone collections, see [Understanding collections](https://docs.pinecone.io/docs/collections).

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
  vectorCount: 99
}
```

### List Collections

The result of this command is an array of collection names.

```typescript
> const list = await pinecone.listCollections();
["collection1", "collection2"]
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

### Targeting a namespace

> [!NOTE]
> Indexes in the [gcp-starter environment](https://docs.pinecone.io/docs/starter-environment) do not support namespaces.

By default all data operations take place inside the default namespace of `''`. If you are working with other non-default namespaces, you can target the namespace by chaining a call to `namespace()`.

```typescript
const pinecone = new Pinecone();
const index = pinecone.index('test-index').namespace('ns1');

// Now perform index operations in the targeted index and namesapce
await index.fetch(['1']);
```

If needed, you can check the currently targeted index and namespace by inspecting the `target` property of an index object.

```typescript
const pinecone = new Pinecone();
const index = pinecone.index('test-index').namespace('ns1');

console.log(index.target); // { index: 'test-index', namespace: 'ns1' }
```

See [Using namespaces](https://docs.pinecone.io/docs/namespaces) for more information.

### Upsert vectors

Pinecone expects vector data to have the following form:

```typescript
type Vector = {
  id: string;
  values: Array<number>;
  sparseValues?: Array<number>;
  metadata?: object;
};
```

To upsert some vectors, you can use the client like so.

```typescript
const pinecone = new Pinecone();

// Target an index
const index = pinecone.index('sample-index');

// Prepare your data
const vectors = [
  {
    id: '1',
    values: [0.236, 0.971, 0.559],
  },
  {
    id: '2',
    values: [],
  },
];

// Upsert the data into your index
await index.upsert(vectors);
```

### Seeing index statistics

When experimenting with data operations, it's sometimes helpful to know how many vectors are stored in each namespace. In that case,
target the index and use the `describeIndexStats()` command.

```typescript
> await pinecone.index('example-index').describeIndexStats()
{
  namespaces: {
    '': { vectorCount: 10 }
    foo: { vectorCount: 2000 },
    bar: { vectorCount: 2000 }
  },
  dimension: 1536,
  indexFullness: 0,
  totalVectorCount: 4010
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

For example, to query by vector values you would pass options like these:

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

#### Querying by vector id

You can query using an existing vector in the index by passing an id.

```typescript
await pinecone.index('my-index').query({ topK: 10, id: '1' });
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
const vectors = [...]

// Upsert data. Specify a chunkSize if you are trying to upsert
// a large number of vectors at once
await index.upsert({ vectors, chunkSize: 100 })

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

### Update a vector

You may want to update vector `values`, `sparseValues`, or `metadata`. Specify the id and the attribute value you want to update.

```
await pinecone.index('imdb-movies').update({
  id: '18593',
  metadata: { genre: 'romance' }
})
```

### Fetch vectors by their IDs

```typescript
const fetchResult = await index.fetch(['id-1', 'id-2']);
```

### Delete vectors

For convenience there are several delete-related methods. You can verify the results of a delete operation by trying to `fetch()` a vector or looking at the index summary with `describeIndexStats()`

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
await client.index('albums-database').deleteMany({ filter: { genre: 'rock' } });
```

#### Delete all vectors in a namespace

> [!NOTE]
> Indexes in the [gcp-starter environment](https://docs.pinecone.io/docs/starter-environment) do not support namespaces.

To nuke everything in the targeted namespace, use the `deleteAll` method.

```typescript
const index = pinecone.index('my-index');
await index.namespace('foo-namespace').deleteAll();
```

If you do not specify a namespace, the vectors in the default namespace `''` will be deleted.

## Productionizing

If you are ready to take a JavaScript application to production where raw performance is the overriding concern, you can set the environment variable `PINECONE_DISABLE_RUNTIME_VALIDATIONS="true"` to disable runtime argument validation in the Pinecone client. Runtime validations are used to provide feedback when incorrect method options are provided, for example if you attempt to create an index without specifying a required dimension property.

These runtime validations are most helpful for users who are not developing with Typescript or who are experimenting in a REPL or notebook-type setting. But once you've tested an application and have gained confidence things are working as expected, you can disable these checks to gain a small improvement in performance. This will have the most impact if your workload is upserting very large amounts of data.
