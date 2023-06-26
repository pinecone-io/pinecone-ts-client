# README: Upcoming v1 client

**This README is a draft related to an upcoming release of the node pinecone client. Everything in this document is subject to change.**

## Client Initialization

To get started, you need to create a client that specifies your Pinecone credentials. These values are found in Pinecone's web-based developer console.

```
import { Pinecone } from '@pinecone-database/pinecone`

const client = await Pinecone.createClient({
    apiKey: 'your-api-key',
    environment: 'your-environment'
})

```

It also can find information specified in the environment variables `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`.

## Control Plane

### Create an index

The minimum required configuration to create an index is the index name and dimension. The dimension you choose should match the output of the model used to produce your embeddings.

```
await client.createIndex({ name: 'my-index', dimension: 128 })
```

In a more expansive example, you can specify the metric, number of pods, number of replicas, and pod type.

```
await client.createIndex({
 name: 'my-index',
 dimension: 128,
 metric: 'cosine',
 pods: 1,
 replicas: 2,
 podType: 'p1.x1'
})
```

By default all metadata fields are indexed when vectors are upserted with metadata, but if you want to improve performance you can specify the specific fields you want to index. This example is showing a few hypothetical metadata fields, but the values you'd use depend on what metadata you plan to store in Pinecone alongside your vectors.

```
await client.createIndex({ name: 'my-index', dimension: 128, metadataConfig: { 'indexed' : ['productName', 'productDescription'] }})
```

### Describe an index

After you've created an index, you can view its configuration.

```
const config = await client.describeIndex('my-index')
// {
//   database: {
//     name: 'my-index',
//     metric: 'cosine',
//     pods: 1,
//     replicas: 1,
//     shards: 1,
//     podType: 'p1.x1'
//   },
//   status: { ready: false, state: 'Ready' }
// }
```

### List indexes

```
const indexList = await client.listIndexes()
// ['my-index']
```

### Delete an index

```
await client.deleteIndex('my-index')
```

### Configure an index

You can adjust the number of replicas or scale to a larger pod size (specified with `podType`). See [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes). You cannot downgrade pod size or change the base pod type.

```
await client.configureIndex('my-index', { replicas: 3, podType: 'p1.x2' })
const config = await client.describeIndex('my-index')
// {
//   database: {
//     name: 'my-index',
//     metric: 'cosine',
//     pods: 3,
//     replicas: 3,
//     shards: 1,
//     podType: 'p1.x2'
//   },
//   status: { ready: false, state: 'ScalingUpPodType' }
// }
```
