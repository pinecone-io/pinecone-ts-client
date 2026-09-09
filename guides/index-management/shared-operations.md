# Common Index Operations

This guide covers operations that are common to both serverless and pod-based indexes.

## List indexes

The `pc.indexes.list` command returns an object with an array of index models:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const list = await pc.indexes.list();
console.log(list);
// {
//   indexes: [
//     {
//       name: 'serverless-index',
//       dimension: 1536,
//       metric: 'cosine',
//       host: 'serverless-index-4zo0ijk.svc.us-west2-aws.pinecone.io',
//       deletionProtection: 'disabled',
//       spec: {
//         serverless: {
//           cloud: 'aws',
//           region: 'us-west-2'
//         }
//       },
//       status: {
//         ready: true,
//         state: 'Ready'
//       }
//     },
//     {
//       name: 'pod-index',
//       dimension: 1536,
//       metric: 'cosine',
//       host: 'pod-index-4zo0ijk.svc.us-west2-aws.pinecone.io',
//       deletionProtection: 'disabled',
//       spec: {
//         pod: {
//           environment: 'us-west2-aws',
//           replicas: 1,
//           shards: 1,
//           podType: 'p1.x1',
//           pods: 1
//         }
//       },
//       status: {
//         ready: true,
//         state: 'Ready'
//       }
//     }
//   ]
// }
```

## Describe an index

You can fetch the description of any index by name using `pc.indexes.describe`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexDescription = await pc.indexes.describe('serverless-index');
console.log(indexDescription);
// {
//   name: 'serverless-index',
//   dimension: 1536,
//   metric: 'cosine',
//   host: 'serverless-index-4zo0ijk.svc.us-west2-aws.pinecone.io',
//   deletionProtection: 'disabled',
//   spec: {
//     serverless: {
//       cloud: 'aws',
//       region: 'us-west-2'
//     }
//   },
//   status: {
//     ready: true,
//     state: 'Ready'
//   }
// }
```

## Delete an index

Indexes are deleted by name:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.delete('sample-index');
```

## Configure an index

### Configure serverless indexes

For serverless indexes, you can configure deletion protection, tags:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Enable deletion protection
await pc.indexes.configure('serverless-index', {
  deletionProtection: 'enabled',
});

// Update tags
await pc.indexes.configure('serverless-index', {
  tags: { environment: 'production' },
});

// Delete a tag by setting it to empty string
await pc.indexes.configure('serverless-index', {
  tags: { environment: '' },
});
```

### Configure pod-based indexes

> **Note:** This section applies to [pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/understanding-pod-based-indexes) only. With serverless indexes, you don't configure any compute or storage resources.

You can adjust the number of replicas or scale to a larger pod size (specified with `podType`). See [Scale pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/scale-pod-based-indexes). You cannot downgrade pod size or change the base pod type.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.configure('pod-index', {
  podReplicas: 2,
  podType: 'p1.x4',
});

const config = await pc.indexes.describe('pod-index');
console.log(config);
// {
//   name: 'pod-index',
//   dimension: 1536,
//   metric: 'cosine',
//   host: 'pod-index-4zo0ijk.svc.us-east1-gcp.pinecone.io',
//   deletionProtection: 'disabled',
//   spec: {
//     pod: {
//       environment: 'us-east1-gcp',
//       replicas: 2,
//       shards: 2,
//       podType: 'p1.x4',
//       pods: 4,
//       metadataConfig: { ... }
//     }
//   },
//   status: {
//     ready: true,
//     state: 'ScalingUpPodSize'
//   }
// }
```

## Deletion protection

You can configure both serverless and pod indexes with `deletionProtection`. Any index with this property set to `'enabled'` will be unable to be deleted. By default, `deletionProtection` will be set to `'disabled'` if not provided as part of the `pc.indexes.create` request.

To enable `deletionProtection` you can pass the value while calling `pc.indexes.create`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.create({
  name: 'deletion-protected-index',
  dimension: 1536,
  metric: 'cosine',
  deletionProtection: 'enabled',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
});
```

To disable deletion protection, you can use the `pc.indexes.configure` operation:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.configure('deletion-protected-index', {
  deletionProtection: 'disabled',
});
```

## Index tags

You can create or configure serverless and pod indexes with [tags](https://docs.pinecone.io/guides/indexes/tag-an-index). Indexes can hold an arbitrary number of tags outlining metadata you would like attached to the index object itself, such as team ownership, project, or any other relevant information.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Create index with tag
await pc.indexes.create({
  name: 'tag-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
  tags: { team: 'data-science' },
});

// Configure index with a new tag
await pc.indexes.configure('tag-index', {
  tags: { project: 'recommendation' },
});

// Delete an existing tag (pass empty string to delete)
await pc.indexes.configure('tag-index', {
  tags: { project: '' },
});
```
