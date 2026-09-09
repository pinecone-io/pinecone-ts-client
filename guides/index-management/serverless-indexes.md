# Serverless Indexes

Serverless indexes support documents with full-text search, dense and sparse vectors, and integrated embedding models. The 2026-07 API creates managed indexes with a `schema` describing searchable fields and a `deployment` choosing the cloud and region.

Both [document indexes](#document-indexes-with-full-text-search) and [vector indexes](#dense-and-sparse-vector-indexes) are supported workflows for new applications. Choose the schema and operations that match how you want to store and search your data.

For introductory information, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes).

## Document indexes with full-text search

Declare named string fields with `fullTextSearch: {}` to search document text without generating embeddings. You do not need a vector field, dimension, or metric for a text-only index.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const indexModel = await pc.indexes.create({
  name: 'knowledge-base',
  schema: {
    fields: {
      title: { type: 'string', fullTextSearch: {} },
      body: { type: 'string', fullTextSearch: {} },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
  waitUntilReady: true,
  timeout: 180_000,
});

const index = pc.index({ host: indexModel.host, namespace: 'articles' });
await index.documents.upsert({
  documents: [
    {
      _id: 'article-1',
      title: 'Growing apples',
      body: 'Apple trees need sunlight and well-drained soil.',
      category: 'gardening',
    },
  ],
});

// Newly upserted documents may take time to become searchable.
const results = await index.documents.search({
  scoreBy: [{ type: 'text', fields: ['title', 'body'], query: 'apple trees' }],
  filter: { category: { $eq: 'gardening' } },
  topK: 5,
  includeFields: ['title', 'body'],
});
console.log(results.matches);
```

The index schema declares searchable text and vector fields. Include filtering metadata such as `category` in the documents you upsert; it is indexed for filtering automatically and should not be declared in the create-index schema. Plain strings without `fullTextSearch`, numbers, booleans, and string lists are metadata, not searchable field declarations.

Use the document operations for this index: `index.documents.upsert`, `index.documents.search`, `index.documents.fetch`, `index.documents.update`, and `index.documents.delete`. See [working with documents](../data-operations/working-with-documents.md) for the document lifecycle and search options.

## Documents with vector fields

A document schema can also include named dense and sparse vector fields alongside full-text fields. For example, this index can store article text and embeddings together:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
await pc.indexes.create({
  name: 'articles-with-embeddings',
  schema: {
    fields: {
      body: { type: 'string', fullTextSearch: {} },
      embedding: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
      keywords: { type: 'sparse_vector' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
});
```

Use `index.documents.search` scoring clauses to target the named text or vector fields. Search text or one vector field per request; vector and text scoring cannot be combined in one request. See [document vector search](../data-operations/working-with-documents.md#search-vector-fields-in-documents) for examples. You supply the vectors for fields declared as `dense_vector` or `sparse_vector`. A schema can contain at most one dense vector field, one sparse vector field, and 100 full-text search fields, and must contain at least one searchable field.

To have Pinecone generate embeddings from document text, use `pc.indexes.createForModel` instead. That operation creates a `semantic_text` field from the model and field mapping; `semantic_text` cannot be declared directly in `pc.indexes.create`. See [integrated inference](../inference/integrated-inference.md) for creating and using these indexes.

## Dense and sparse vector indexes

To create an index for vector operations (`upsert`, `query`, and `fetch`), declare the reserved `_values` field for dense vectors or `_sparse_values` for sparse vectors. A dense field requires its dimension and metric; a sparse field has neither.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.create({
  name: 'index-for-dense-vectors',
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
});

await pc.indexes.create({
  name: 'index-for-sparse-vectors',
  schema: { fields: { _sparse_values: { type: 'sparse_vector' } } },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
});
```

Reserved vector fields cannot be combined with custom document fields in the same schema. Custom schema field names select the documents API instead, even if the schema contains only vector fields. Legacy `dimension`, `metric`, `vectorType`, and `spec` options remain compatibility inputs, but should not be mixed with the native `schema` and `deployment` shape. See [working with vectors](../data-operations/working-with-vectors.md) for vector operations.

## Available clouds

Choose the cloud and region in `deployment`. See [available cloud regions](https://docs.pinecone.io/guides/index-data/create-an-index#cloud-regions) for supported deployments. For example, a managed GCP deployment uses:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
await pc.indexes.create({
  name: 'my-index',
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  deployment: {
    deploymentType: 'managed',
    cloud: 'gcp',
    region: 'us-central1',
  },
});
```

## Read capacity

Read capacity is a top-level option. On-demand mode is the default. Dedicated mode places its node type and manual scaling settings under `dedicated`.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
await pc.indexes.create({
  name: 'dedicated-index',
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
  readCapacity: {
    mode: 'Dedicated',
    dedicated: {
      nodeType: 't1',
      scaling: 'Manual',
      manual: { shards: 2, replicas: 2 },
    },
  },
  waitUntilReady: true,
  timeout: 180_000,
});
```

Once the index is ready, you can change its dedicated capacity:

```typescript
await pc.indexes.configure('dedicated-index', {
  readCapacity: {
    mode: 'Dedicated',
    dedicated: {
      nodeType: 't1',
      scaling: 'Manual',
      manual: { shards: 3, replicas: 2 },
    },
  },
});
```

Alternatively, switch a ready index to on-demand capacity:

```typescript
await pc.indexes.configure('dedicated-index', {
  readCapacity: { mode: 'OnDemand' },
});
```

Configuration changes are asynchronous. Wait for the index to become ready before submitting another configuration change; use `pc.indexes.describe` to inspect its status.

## Metadata indexing for a namespace

Legacy `spec.serverless.schema` metadata settings are not accepted by the 2026-07 create-index operation. For selective metadata indexing, create a namespace on an existing index with a namespace schema. This metadata schema is distinct from the index schema that declares vector or text fields.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'index-for-dense-vectors' });
await index.createNamespace({
  name: 'filtered-records',
  schema: {
    fields: {
      genre: { filterable: true },
      year: { filterable: true },
    },
  },
});
```

When a namespace schema is supplied, only its listed fields are indexed for filtering. `filterable: false` is not supported; omit fields that should not be indexed.

## Wait for readiness

Set `waitUntilReady: true` to wait for creation, and use `timeout` to bound that wait.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const indexModel = await pc.indexes.create({
  name: 'ready-index',
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
  waitUntilReady: true,
  timeout: 180_000,
});
const index = pc.index({ host: indexModel.host });
```

See [common operations](./shared-operations.md) for the rest of the index lifecycle.
