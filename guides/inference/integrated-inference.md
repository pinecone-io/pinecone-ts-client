<a id="integrated-inference"></a>

# Legacy Integrated Indexes

An index created with `pc.indexes.createForModel` is a legacy integrated index. Pinecone embeds the text of one mapped field with a hosted model, and you read and write the index through the legacy Records API: `upsertRecords` and `searchRecords`, which can also rerank results.

For new work, create a document index with [integrated embedding](../data-operations/working-with-documents.md#integrated-embedding) instead: declare `embed` or `sparseEmbed` on a `string` field in `pc.indexes.create`, and read and write the index through `index.documents`. A document index adds full-text search on the same fields, and `scoreBy` clauses across several searchable fields.

For more information, see [Upsert and search with integrated inference](https://docs.pinecone.io/guides/inference/integrated-inference).

## Create an index for a model

A legacy integrated index is a serverless index configured for one embedding model. Use the `pc.indexes.createForModel` method to create one:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.indexes.createForModel({
  name: 'integrated-index',
  cloud: 'aws',
  region: 'us-east-1',
  embed: {
    model: 'multilingual-e5-large',
    fieldMap: { text: 'chunk_text' },
  },
  waitUntilReady: true,
});
```

The `fieldMap` specifies which field in your records contains the text to be embedded. In this example, records must have a `chunk_text` field.

## Upsert records with text

Once you have an index configured for a specific embedding model, use the `upsertRecords` operation to convert your source data to embeddings and upsert them into a namespace.

Each record must contain:

- A unique `id` (or `_id`) field
- A field matching the `fieldMap` specified when creating the index (e.g., `chunk_text`)
- Any additional fields will be stored as metadata

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const index = pc.index({ name: 'integrated-index', namespace: 'namespace1' });

const records = [
  {
    id: 'rec1',
    chunk_text:
      "Apple's first product, the Apple I, was released in 1976 and was hand-built by co-founder Steve Wozniak.",
    category: 'product',
  },
  {
    id: 'rec2',
    chunk_text:
      'Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut.',
    category: 'nutrition',
  },
  {
    id: 'rec3',
    chunk_text:
      'Apples originated in Central Asia and have been cultivated for thousands of years, with over 7,500 varieties available today.',
    category: 'cultivation',
  },
  {
    id: 'rec4',
    chunk_text:
      'In 2001, Apple released the iPod, which transformed the music industry by making portable music widely accessible.',
    category: 'product',
  },
];

await index.upsertRecords({ records });
```

## Search with text queries

Use the `searchRecords` method to convert a query to a vector embedding and then search your namespace for the most semantically similar records, along with their similarity scores.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const index = pc.index({ name: 'integrated-index', namespace: 'namespace1' });

// Search for 4 records most semantically relevant to the query
const response = await index.searchRecords({
  query: {
    topK: 4,
    inputs: { text: 'Disease prevention' },
  },
});

console.log(response);
// {
//   matches: [
//     {
//       id: 'rec2',
//       score: 0.847,
//       record: {
//         id: 'rec2',
//         chunk_text: 'Apples are a great source of dietary fiber...',
//         category: 'nutrition'
//       }
//     },
//     // ... more matches
//   ],
//   usage: { readUnits: 5, egressBytes: 896 }
// }
```

## Search with reranking

To rerank initial search results based on relevance to the query, add the `rerank` parameter, including the reranking model you want to use, the number of reranked results to return, and the fields to use for reranking.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const index = pc.index({ name: 'integrated-index', namespace: 'namespace1' });

const response = await index.searchRecords({
  query: {
    topK: 10,
    inputs: { text: 'Disease prevention' },
  },
  rerank: {
    model: 'bge-reranker-v2-m3',
    topN: 3,
    rankFields: ['chunk_text'],
  },
  fields: ['category', 'chunk_text'],
});

console.log(response);
// {
//   matches: [
//     {
//       id: 'rec2',
//       score: 0.952, // Reranked score
//       record: {
//         id: 'rec2',
//         chunk_text: 'Apples are a great source of dietary fiber...',
//         category: 'nutrition'
//       }
//     },
//     // ... top 3 reranked results
//   ],
//   usage: {
//     readUnits: 5,
//     egressBytes: 512,
//     rerankUnits: 1
//   }
// }
```

## Filtering search results

You can combine text search with metadata filtering:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const index = pc.index({ name: 'integrated-index', namespace: 'namespace1' });

const response = await index.searchRecords({
  query: {
    topK: 4,
    inputs: { text: 'Apple products' },
    filter: { category: { $eq: 'product' } },
  },
});
```

## Specify return fields

By default, all fields are returned in search results. You can specify which fields to return:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const index = pc.index({ name: 'integrated-index', namespace: 'namespace1' });

const response = await index.searchRecords({
  query: {
    topK: 4,
    inputs: { text: 'Apple products' },
  },
  fields: ['category', 'chunk_text'], // Only return these fields
});
```

## Supported models

For a list of available embedding models, see the [model gallery](https://docs.pinecone.io/models/overview). You can also use `pc.inference.listModels()` to see all available models programmatically.

## Complete example

Here's a complete workflow using a legacy integrated index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function legacyIntegratedIndexExample() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  // 1. Create an index for a model
  await pc.indexes.createForModel({
    name: 'my-integrated-index',
    cloud: 'aws',
    region: 'us-east-1',
    embed: {
      model: 'multilingual-e5-large',
      fieldMap: { text: 'content' },
    },
    waitUntilReady: true,
  });

  const index = pc.index({ name: 'my-integrated-index' });

  // 2. Upsert records with text
  await index.upsertRecords({
    records: [
      {
        id: 'article1',
        content: 'Machine learning is transforming healthcare...',
        category: 'healthcare',
      },
      {
        id: 'article2',
        content: 'Artificial intelligence in finance...',
        category: 'finance',
      },
    ],
  });

  // 3. Search with text and reranking
  const results = await index.searchRecords({
    query: {
      topK: 5,
      inputs: { text: 'AI in medical applications' },
    },
    rerank: {
      model: 'bge-reranker-v2-m3',
      topN: 2,
      rankFields: ['content'],
    },
  });

  console.log(results);
}

legacyIntegratedIndexExample();
```

For standalone inference without index integration, see [Inference API](./inference-api.md).
