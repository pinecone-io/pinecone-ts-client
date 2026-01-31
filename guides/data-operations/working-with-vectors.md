# Working with Vectors

This guide covers operations for upserting, querying, fetching, updating, and deleting vectors in Pinecone indexes.

## Targeting an index

To perform data operations on an index, you target it using the `index` method. You can target an index by providing its `name`, its `host`, or both.

### Targeting by name

When you provide only a name, the SDK will automatically call `describeIndex` to resolve the index host URL:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index' });

// Now perform index operations
await index.fetch({ ids: ['1'] });
```

### Targeting by host

You can also provide a host URL to bypass the SDK's default behavior of resolving your index host via the provided index name. You can find your index host in the [Pinecone console](https://app.pinecone.io), or by using the `describeIndex` or `listIndexes` operations.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ host: 'my-index-host-1532-svc.io' });

// Now perform index operations
await index.fetch({ ids: ['1'] });
```

## Targeting with metadata typing

If you are storing metadata alongside your vector values, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

type MovieMetadata = {
  title: string;
  runtime: number;
  genre: 'comedy' | 'horror' | 'drama' | 'action';
};

// Specify a custom metadata type while targeting the index
const index = pc.index<MovieMetadata>({ name: 'test-index' });

// Now you get type errors if upserting malformed metadata
await index.upsert({
  records: [
    {
      id: '1234',
      values: [0.1, 0.2, 0.3, 0.4], // ... embedding values
      metadata: {
        title: 'Gone with the Wind',
        runtime: 238,
        genre: 'drama',
        // @ts-expect-error because category property not in MovieMetadata
        category: 'classic',
      },
    },
  ],
});
```

## Describe index statistics

The following example returns statistics about the index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'example-index' });

const indexStats = await index.describeIndexStats();
console.log(indexStats);
// {
//   namespaces: {
//     '': { recordCount: 10 },
//     foo: { recordCount: 2000 },
//     bar: { recordCount: 2000 }
//   },
//   dimension: 1536,
//   indexFullness: 0,
//   totalRecordCount: 4010
// }
```

## Upsert vectors

Pinecone expects records inserted into indexes to have the following form:

```typescript
type PineconeRecord = {
  id: string;
  values: Array<number>;
  sparseValues?: Array<number>;
  metadata?: object;
};
```

The following example upserts vectors with metadata:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'example-index' });

const upsertResponse = await index.upsert({
  records: [
    {
      id: 'vec1',
      values: [0.1, 0.2, 0.3, 0.4],
      metadata: { genre: 'drama' },
    },
    {
      id: 'vec2',
      values: [0.2, 0.3, 0.4, 0.5],
      metadata: { genre: 'action' },
    },
  ],
  namespace: 'example-namespace',
});

console.log(upsertResponse);
// { upsertedCount: 2 }
```

## Query vectors

### Querying with vector values

The query method accepts a large number of options. The dimension of the query vector must match the dimension of your index.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const queryResponse = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4], // ... query vector
  topK: 10,
  includeValues: true,
  includeMetadata: true,
  filter: {
    genre: { $in: ['comedy', 'documentary', 'drama'] },
  },
  namespace: 'example-namespace',
});

console.log(queryResponse);
// {
//   matches: [
//     {
//       id: '556',
//       score: 1.00000012,
//       values: [0.1, 0.2, 0.3, 0.4],
//       sparseValues: undefined,
//       metadata: { genre: 'drama' }
//     },
//     // ... more matches
//   ],
//   namespace: 'example-namespace',
//   usage: { readUnits: 5 }
// }
```

### Querying by record id

You can query using the vector values of an existing record in the index by passing a record ID:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  id: 'vec1',
  topK: 10,
});
```

## Fetch vectors

The following example fetches vectors by ID:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const fetchResponse = await index.fetch({
  ids: ['vec1', 'vec2'],
  namespace: 'example-namespace',
});

console.log(fetchResponse);
// {
//   records: {
//     vec1: {
//       id: 'vec1',
//       values: [0.1, 0.2, 0.3, 0.4],
//       metadata: { genre: 'drama' }
//     },
//     vec2: {
//       id: 'vec2',
//       values: [0.2, 0.3, 0.4, 0.5],
//       metadata: { genre: 'action' }
//     }
//   },
//   namespace: 'example-namespace'
// }
```

## Update vectors

The following example updates vectors by ID:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

await index.update({
  id: 'vec1',
  values: [0.1, 0.2, 0.3, 0.4],
  setMetadata: { genre: 'drama' },
  namespace: 'example-namespace',
});
```

## Delete vectors

### Delete by IDs

The following example deletes vectors by ID:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

await index.deleteMany({
  ids: ['vec1', 'vec2', 'vec3'],
  namespace: 'example-namespace',
});

// Or delete a single vector
await index.deleteOne({
  id: 'vec1',
  namespace: 'example-namespace',
});
```

### Delete by metadata filter

> **Note:** Deletion by metadata filter only applies to pod-based indexes.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'albums-database' });

await index.deleteMany({
  filter: { genre: 'rock' },
});
```

### Delete all vectors in a namespace

To delete all vectors in a namespace, use the `deleteAll` method:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index', namespace: 'foo-namespace' });

await index.deleteAll();
```

If you do not specify a namespace, the records in the default namespace `''` will be deleted.

## List vector IDs

The `listPaginated` method can be used to list record IDs matching a particular ID prefix in a paginated format. With clever assignment of record ids, this can be used to help model hierarchical relationships between different records such as when there are embeddings for multiple chunks or fragments related to the same document.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index', namespace: 'my-namespace' });

// Fetch the first 3 vector IDs matching prefix 'doc1#'
const results = await index.listPaginated({
  limit: 3,
  prefix: 'doc1#',
});

console.log(results);
// {
//   vectors: [
//     { id: 'doc1#01' },
//     { id: 'doc1#02' },
//     { id: 'doc1#03' }
//   ],
//   pagination: {
//     next: 'eyJza2lwX3Bhc3QiOiJwcmVUZXN0LS04MCIsInByZWZpeCI6InByZVRlc3QifQ=='
//   },
//   namespace: 'my-namespace',
//   usage: { readUnits: 1 }
// }

// Fetch the next page using the pagination token
const nextResults = await index.listPaginated({
  prefix: 'doc1#',
  paginationToken: results.pagination?.next,
});
```

For more information on metadata filtering patterns, see [Metadata Filtering](./metadata-filtering.md).
