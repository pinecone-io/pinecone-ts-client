# Serverless Indexes

For introductory information on indexes, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes)

## Sparse vs Dense embedding vectors

When you are working with dense embedding vectors, you must specify the `dimension` of the vectors you expect to store at the time your index is created. For sparse vectors, used to represent vectors where most values are zero, you omit `dimension` and must specify `vectorType: 'sparse'`.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Create an index for dense vectors
await pc.createIndex({
  name: 'index-for-dense-vectors',
  dimension: 1536,
  metric: 'cosine',
  // vectorType: 'dense' is the default value, so it can be omitted if you prefer
  vectorType: 'dense',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
});

// Create an index for sparse vectors
await pc.createIndex({
  name: 'index-for-sparse-vectors',
  metric: 'dotproduct',
  vectorType: 'sparse',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
});
```

## Available clouds

See the [available cloud regions](https://docs.pinecone.io/troubleshooting/available-cloud-regions) page for the most up-to-date information on which cloud regions are available.

### Create a serverless index on Amazon Web Services (AWS)

The following example creates a serverless index in the `us-west-2` region of AWS. For more information on serverless and regional availability, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
  vectorType: 'dense',
});
```

### Create a serverless index on Google Cloud Platform

The following example creates a serverless index in the `us-central1` region of GCP. For more information on serverless and regional availability, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'gcp',
      region: 'us-central1',
    },
  },
});
```

### Create a serverless index on Azure

The following example creates a serverless index on Azure. For more information on serverless and regional availability, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'azure',
      region: 'eastus2',
    },
  },
});
```

## Read Capacity Configuration

You can configure the read capacity mode for your serverless index. By default, indexes are created with `OnDemand` mode. You can also specify `Dedicated` mode with dedicated read nodes.

### Dedicated Read Capacity

Dedicated mode allocates dedicated read nodes for your workload. You must specify `nodeType`, `scaling`, and scaling configuration.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'gcp',
      region: 'us-central1',
      readCapacity: {
        mode: 'Dedicated',
        dedicated: {
          nodeType: 't1',
          scaling: 'Manual',
          manual: {
            shards: 2,
            replicas: 2,
          },
        },
      },
    },
  },
});
```

### Configuring Read Capacity

You can change the read capacity configuration of an existing serverless index using `configureIndex`. This allows you to:

- Switch between OnDemand and Dedicated modes
- Adjust the number of shards and replicas for Dedicated mode with manual scaling

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Switch to OnDemand read capacity
await pc.configureIndex({
  name: 'my-index',
  readCapacity: { mode: 'OnDemand' },
});

// Switch to Dedicated read capacity with manual scaling
await pc.configureIndex({
  name: 'my-index',
  readCapacity: {
    mode: 'Dedicated',
    dedicated: {
      nodeType: 't1',
      scaling: 'Manual',
      manual: {
        shards: 3,
        replicas: 2,
      },
    },
  },
});

// Scale up by increasing shards and replicas
await pc.configureIndex({
  name: 'my-index',
  readCapacity: {
    mode: 'Dedicated',
    dedicated: {
      nodeType: 't1',
      scaling: 'Manual',
      manual: {
        shards: 4,
        replicas: 3,
      },
    },
  },
});
```

When you change read capacity configuration, the index will transition to the new configuration. You can use `describeIndex` to check the status of the transition.

## Metadata Schema Configuration

You can configure which metadata fields are filterable by specifying a metadata schema. By default, all metadata fields are indexed. However, large amounts of metadata can cause slower index building as well as slower query execution, particularly when data is not cached in a query executor's memory and local SSD and must be fetched from object storage.

To prevent performance issues due to excessive metadata, you can limit metadata indexing to the fields that you plan to use for query filtering. When you specify a metadata schema, only fields marked as `filterable: true` are indexed and can be used in filters.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
      schema: {
        genre: { filterable: true },
        year: { filterable: true },
        description: { filterable: true },
      },
    },
  },
});
```

## Waiting for Index Readiness

When you create an index, it takes some time to be ready. You can optionally wait for the index to be ready by setting `waitUntilReady: true`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
  waitUntilReady: true,
});

// The index is now ready to use
const index = pc.index({ name: 'my-index' });
```

## Configuring, listing, describing, and deleting

See [common operations](shared-operations.md) to learn about how to manage the lifecycle of your index after it is created.
