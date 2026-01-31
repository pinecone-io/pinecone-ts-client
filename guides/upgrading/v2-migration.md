# v2 Migration Guide

**Warning:** This migration guide is specific to migrating from the `v1.x` to `v2.x`. The code examples in this guide demonstrate moving from `v1.x` to `v2.x`. For details on migrating from `v0.x` please see the [v1-migration guide](https://github.com/pinecone-io/pinecone-ts-client/blob/main/v1-migration.md).

## Changes overview

- The `v2` TypeScript SDK is consuming the new Global Control Plane API. This results in a large amount of flexibility in how API keys are used in comparison to the `v1` TypeScript SDK built around the legacy regional control planes where API keys and environments had a rigid 1:1 relationship.
- Refactored `createIndex` to accept either a `PodSpec` or `ServerlessSpec` interface depending on how users would like to deploy their index. Many old properties such as `podType`, `pods`, etc are moved into `PodSpec` since they do not apply to serverless indexes.
- The `listIndexes` function now returns an array with full descriptions of each index rather than an array of names.
- THe `describeIndex` function takes the same argument as before, but returns data in a different shape reflecting the move of some configurations under the `spec` key and elevation of `host` to the top level.
- Added optional environment variables, see below for details.
  - `PINECONE_DEBUG`
  - `PINECONE_DEBUG_CURL`
  - `PINECONE_CONTROLLER_HOST`

# Installation, Importing, and Initialization

## Installing `v2.0.0`

```bash
npm install @pinecone-database/pinecone@2
```

## Importing and Initialization

### Improvements in v2.0.0

Thanks to changes implemented in the Global Control Plane, there is no longer a need to specify environment along with the API key. This allows the use of a single API key to create and manage indexes in multiple environments. We’ve also added the ability to pass `controllerHostUrl` on initialization, which is useful if you’re using a proxy or know the address of your index, allowing you to bypass control plane calls to resolve the index host.

### Initialization with keyword arguments

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your_api_key',
  environment: 'your_environmet',
});
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'your_api_key' });
```

### Initialization with environment variables

If you attempt to initialize with no arguments and the expected environment variable for API key is not set, a `PineconeConfigurationError` will be thrown.

**Before: ≤ 1.1.2**

Expected env vars:

- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`

**After: ≥ 2.0.0**

Expected env vars:

- `PINECONE_API_KEY`

In both cases, when the proper environment variables are set initialization does not require any additional arguments:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone();
```

## New Feature: View verbose debug output about requests

Set `PINECONE_DEBUG=true` and / or `PINECONE_DEBUG_CURL=true` environment variables to see verbose output about the network requests being made. Be careful as this output may include secrets such as API keys passed in request headers.

# Control Plane Operations

The primary differences between `v1.1.2` and `v2.0.0` is how you interact with your indexes through control plane operations. The shape of request and response payloads have changed in some cases as well.

## Creating Indexes

In the new `v2.0.0` client, there is a lot more flexibility in how indexes are created. With the introduction of Pinecone’s serverless offering, we need a way to tell the API how we would like to deploy our index. Many configuration fields are now passed as part of a deployment `spec` parameter, which can contain either a `serverless` configuration, or a `pod` configuration.

### Creating a serverless index

Serverless indexes are newly available with the `v2.0.0` client, and you must be on this version or greater to work with them. Creating a serverless index requires defining the `cloud` and `region` where the server should be hosted via the `spec` object with the key `serverless`. For more information on serverless and regional availability, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'sample-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
});
```

### Creating a pod-based index

The most important changes to how pod indexes are created are:

- Configuration that describes how the index is deployed is now passed as a `spec` object with the key `pod` which should conform to the type of the `PodSpec` interface.
- `environment` used to be a required configuration parameter for the client, but is now passed as part of `PodSpec`.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'sample-index',
  dimension: 1536,
  metric: 'cosine',
  podType: 'p1.x1',
  pods: 1,
  metadataConfig: {
    indexed: ['propertyName'],
  },
});
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'sample-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    pod: {
      environment: 'us-east1-gcp',
      podType: 'p1.x1',
      pods: 1,
      metadataConfig: {
        indexed: ['propertyName'],
      },
    },
  },
});
```

### Special cases: gcp-starter indexes

Starter indexes are a special case of the “pod-based index” described above. Here’s a specific example of how this work post `v2.0.0`.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'sample-index',
  dimension: 1536,
  metric: 'cosine',
});
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'sample-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    pod: {
      environment: 'gcp-starter',
      podType: 'p1.x1',
      pods: 1,
    },
  },
});
```

## Listing Indexes

In the past the `listIndexes` operation returned an array of index names and no other information. In the `v2.0.0` client, the `listIndexes` operation fetches a complete description of each index. The model returned for each index is equivalent to what you would get back from a `describeIndex` call.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexes = await pc.listIndexes();
console.log(indexes);
//[ { name: 'sample-index1' }, { name: 'sample-index2' } ]
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexes = await pc.listIndexes();
console.log(indexes);
// {
//     indexes: [
//       {
//         name: "sample-index-1",
//         dimension: 3,
//         metric: "cosine",
//         host: "sample-index-1-1234567.svc.apw5-2e18-32fa.pinecone.io",
//         spec: {
//           serverless: {
//             cloud: "aws",
//             region: "us-west-2"
//           }
//         },
//         status: {
//           ready: true,
//           state: "Ready"
//         }
//       },
//       {
//         name: "sample-index-2",
//         dimension: 3,
//         metric: "cosine",
//         host: "sample-index-2-1234567.svc.apw2-5e76-83fa.pinecone.io",
//         spec: {
//           serverless: {
//             cloud: "aws",
//             region: "us-west-2"
//           }
//         },
//         status: {
//           ready: true,
//           state: "Ready"
//         }
//       }
//     ]
//   }
```

## Describing indexes

The `describeIndex` operation still takes one argument (the name of an index) which has not changed, but the response now includes different data. The response properties have evolved and moved around so that we can represent the description of both pod and serverless indexes:

| name              | no change                                     |
| ----------------- | --------------------------------------------- |
| dimension         | no change                                     |
| metric            | no change                                     |
| status.ready      | no change                                     |
| status.state      | no change                                     |
| host              | added                                         |
| environment       | added to spec object (for pod indexes)        |
| replicas          | moved to spec object (for pod indexes)        |
| shards            | moved to spec object (for pod indexes)        |
| pods              | moved to spec object (for pod indexes)        |
| pod_type          | moved to spec object (for pod indexes)        |
| metadata_config   | moved to spec object (for pod indexes)        |
| source_collection | moved to spec object (for pod indexes)        |
| region            | added to spec object (for serverless indexes) |
| cloud             | added to spec object (for serverless indexes) |

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const index = await pc.describeIndex('sample-index');
console.log(index);
// {
//     database: {
//         name: 'sample-index',
//         dimension: 3,
//         metric: 'cosine',
//         pods: 1,
//         replicas: 1,
//         shards: 1,
//         podType: 'p1.x1'
//     },
//     status: {
//         ready: true,
//         state: 'Ready',
//         host: 'search-history-1234567.svc.us-east4-gcp.pinecone.io',
//         port: 433
//     }
// }
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const index = await pc.describeIndex('sample-index');
console.log(index);
// {
//     name: 'sample-index-1',
//     dimension: 3,
//     metric: 'cosine',
//     host: 'sample-index-1-1390950.svc.apw5-4e34-81fa.pinecone.io',
//     spec: {
//           pod: undefined,
//           serverless: {
//               cloud: 'aws',
//               region: 'us-west-2'
//           }
//     },
//     status: {
//           ready: true,
//           state: 'Ready'
//     }
// }
```

## Deleting Indexes

There are no significant changes to the `deleteIndex` operation.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.deleteIndex('sample-index');
```

## Configure pod-based indexes

Configuring an index after creation is specific to pod indexes. With serverless indexes, you don't configure any compute or storage resources. Calls to `configureIndex` are unchanged. However, `v2.0.0` will return the index object after a successful configuration request.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.configureIndex('sample-index', { replicas: 5, podType: 'p2.x2' });
// undefined
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.configureIndex('sample-index', { replicas: 5, podType: 'p2.x2' });
// {
//   name: 'sample-index',
//   dimension: 3,
//   metric: 'cosine',
//   host: 'sample-index-1-1390950.svc.apw5-4e34-81fa.pinecone.io',
//   spec: {
// 		pod: {
// 			environment: 'us-west-1-aws',
// 			replicas: 1,
// 			shards: 1,
// 			podType: 'p1.x1',
// 			pods: 10
// 		},
// 	},
//   status: {
// 		ready: false,
// 		state: 'ScalingUp'
// 	}
// }
```

## Collections

> ℹ️ **Note**
>
> Serverless and starter indexes do not support collections.

Collection operations in the SDK are largely unchanged. However, note that collections can only be created from data in pod indexes, and collections can only be used to create pod indexes. Attempting to use these with serverless indexes will result in errors.

### Create collection

The `createCollection` operation is unchanged. However, `v2.0.0` will return the collection model after a successful create request.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createCollection({
  name: 'sample-collection',
  source: 'sample-index',
});
// undefined
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createCollection({
  name: 'sample-collection',
  source: 'sample-index',
});
// {
// 	name: 'sample-collection',
// 	size: 1532895,
// 	status: 'Ready',
// 	dimension: 10,
// 	recordCount: 2039,
// 	environment: 'us-west-1-aws'
// }
```

### List collections

The `listCollections` response now contains the full collection models.

**Before: ≤ 1.1.2**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.listCollections();
// [{ name: 'sample-collection-1' }, { name: 'sample-collection-2' }];
```

**After: ≥ 2.0.0**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.listCollections();
// {
//   collections: [
//     {
//       name: 'sample-collection-1',
//       size: 1532895,
//       status: 'Ready',
//       dimension: 10,
//       recordCount: 2039,
//       environment: 'us-west-1-aws',
//     },
//     {
//       name: 'sample-collection-2',
//       size: 28393829,
//       status: 'Ready',
//       dimension: 15,
//       recordCount: 3129,
//       environment: 'us-west-1-aws',
//     },
//   ];
// }
```

### Describe collection

The `describeCollections` operation is unchanged. `v2.0.0` will return an additional field denoting the environment in which the collection is hosted.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.describeCollection('sample-collection');
// {
// 	name: 'sample-collection',
// 	size: 1532895,
// 	status: 'Ready',
// 	dimension: 10,
// 	recordCount: 2039,
// 	environment: 'us-west-1-aws' // only returned by v2.0.0
// }
```

### Delete collection

The `deleteCollection` operation is unchanged.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.deleteCollection('sample-collection');
```

# Vector Operations

Across both client versions vector operations remain largely unchanged. Data plane operations are performed against specific indexes. The SDK will resolve the relevant host for each index automatically when you target an index for operations. Targeting an index involves using the `index` method and providing an index name.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const index = pc.index('my-index');

// Now perform data plane operations against 'my-index'
await index.fetch(['1', '2', '3']);
```

## Vector Operations: Upsert, query, fetch, etc

Once you've targeted an index, the usage for data plane operations has not changed. Please see the section in the `README.md` [Index operations](https://github.com/pinecone-io/pinecone-ts-client#index-operations).

### For serverless indexes, see cost information in responses

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();
const index = pc.index('my-index');

index.fetch(['1']);
// {
//   records: {
//     '1': {
//       id: '1',
//       values: [0.5, 0.7],
//       sparseValues: undefined,
//       metadata: undefined
//     }
//   },
//   namespace: '',
//   usage: {
//     readUnits: 5
//   }
// }

index.query({ vector: [0.3, 0.5], topK: 1 });
// {
//   matches: [
//     {
//       id: '556',
//       score: 1.00000012,
//       values: [],
//       sparseValues: undefined,
//       metadata: undefined
//     }
//   ],
//   namespace: '',
//   usage: {
//     readUnits: 5
//   }
// }
```
