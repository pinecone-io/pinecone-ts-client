# Serverless Indexes

For introductory information, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes).

## Dense and sparse vector indexes

The 2026-07 API creates managed indexes with a `schema` and `deployment`. To use the existing vector operations (`upsert`, `query`, and `fetch`), declare only the reserved `_values` field for dense vectors or `_sparse_values` for sparse vectors. A dense field requires its dimension and metric; a sparse field has neither.

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

Custom schema field names select the documents API instead. Use document operations such as `index.upsertDocuments` and `index.searchDocuments` for that schema. Legacy `dimension`, `metric`, `vectorType`, and `spec` options remain compatibility inputs, but should not be mixed with the native `schema` and `deployment` shape.

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
});

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

await pc.indexes.configure('dedicated-index', {
  readCapacity: { mode: 'OnDemand' },
});
```

Configuration changes are asynchronous. Use `pc.indexes.describe` to inspect the transition.

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
