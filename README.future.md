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

## Data Plane

### List indexes

```
client.listIndexes()
```

### Describe index

```
client.describeIndex('my-index-name')
```