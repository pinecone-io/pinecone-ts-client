# Pod Indexes

This page talks about working with pod-based indexes with TypeScript. For an overview of the most important concepts, please see [Understanding pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/understanding-pod-based-indexes)

## Create a pod index

The following example creates an index without a metadata configuration. By default, Pinecone indexes all metadata.

This example shows some optional properties, [tags and deletion protection](shared-operations.md), in use.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexConfig = await pc.createIndex({
  name: 'example-index',
  dimension: 1536,
  metric: 'cosine',
  deletionProtection: 'enabled',
  spec: {
    pod: {
      environment: 'eu-west1-gcp',
      podType: 'p1.x1',
    },
  },
  tags: {
    environment: 'production',
    app: 'chat-support',
  },
});

console.log(indexConfig);
// {
//   name: 'example-index',
//   metric: 'cosine',
//   host: 'example-index-dojoi3u.svc.eu-west1-gcp.pinecone.io',
//   spec: {
//     pod: {
//       environment: 'eu-west1-gcp',
//       podType: 'p1.x1',
//       replicas: 1,
//       shards: 1,
//       pods: 1
//     }
//   },
//   status: {
//     ready: true,
//     state: 'Ready'
//   },
//   vectorType: 'dense',
//   dimension: 1536,
//   deletionProtection: 'enabled',
//   tags: {
//     app: 'chat-support',
//     environment: 'production'
//   }
// }
```

This create command will block for a few moments (seconds to minutes) while pods are being deployed. If you would prefer for the function to return immediately instead of waiting for the index to be ready for use, you can omit the `waitUntilReady` option (it defaults to false).

## Optional spec configurations when creating pod indexes

Pod indexes support many optional configuration fields through the spec object. For example, if your workload requires a more powerful pod type or additional replicas, those would be indicated using properties in the `pod` object.

Also, if you have [high-cardinality metadata](https://docs.pinecone.io/guides/indexes/pods/manage-pod-based-indexes#high-cardinality-metadata-and-over-provisioning) stored with your vectors, you can significantly improve your memory performance by telling Pinecone which fields you plan to use for filtering. These settings are conveyed with an optional `metadataConfig` property.

The following example creates an index that only indexes the "color" metadata field for queries with filtering; with this metadata configuration, queries against the index cannot filter based on any other metadata field.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'example-index-2',
  dimension: 1536,
  spec: {
    pod: {
      environment: 'eu-west1-gcp',
      podType: 'p1.x1',
      metadataConfig: {
        indexed: ['color'],
      },
      replicas: 2,
    },
  },
});
```

## Creating a pod-based index from a collection

For more info on collections, see [Collections](./collections.md)

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndex({
  name: 'index-name',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    pod: {
      environment: 'us-west1-gcp',
      sourceCollection: 'name-of-collection',
    },
  },
});
```

## Scaling your pod-based index with `configureIndex`

Please see this page [Scaling pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/scale-pod-based-indexes) for an introduction to core concepts related to scaling Pinecone indexes.

If you wish to scale horizontally with `replicas` or vertically with `podType`, both of those fields can be passed to `configureIndex` to make changes to an existing index. Changes are not instantaneous; call `describeIndex` to see whether the configuration change has been completed.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.configureIndex({
  name: 'example-index',
  podReplicas: 4,
  podType: 'p1.x2',
});
```

## Configuring, listing, describing, and deleting

See [common operations](shared-operations.md) to learn about how to manage the lifecycle of your index after it is created.
