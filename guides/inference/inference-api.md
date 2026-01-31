# Inference API

Use embedding and reranking models hosted by Pinecone. Learn more about Inference in the [docs](https://docs.pinecone.io/guides/inference/understanding-inference).

## Models

To see available models, you can use the `getModel` and `listModels` methods on the `Inference` class:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const models = await pc.inference.listModels();
console.log(models);
// {
//   models: [
//     {
//       model: 'multilingual-e5-large',
//       shortDescription: 'A high performance dense embedding model...',
//       type: 'embed',
//       vectorType: 'dense',
//       defaultDimension: 1024,
//       modality: 'text',
//       maxSequenceLength: 2048,
//       maxBatchSize: 96,
//       providerName: 'Pinecone',
//       supportedDimensions: [Array],
//       supportedMetrics: [Array],
//       supportedParameters: [Array]
//     },
//     // ... more models
//   ]
// }

const model = await pc.inference.getModel('multilingual-e5-large');
console.log(model);
```

## Create embeddings

Generate embeddings for documents and queries:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const embeddingModel = 'multilingual-e5-large';

const documents = [
  'Turkey is a classic meat to eat at American Thanksgiving.',
  'Many people enjoy the beautiful mosques in Turkey.',
];

// Generate document embeddings
const docEmbeddings = await pc.inference.embed({
  model: embeddingModel,
  inputs: documents,
  parameters: {
    inputType: 'passage',
    truncate: 'END',
  },
});

console.log(docEmbeddings);
// {
//   model: 'multilingual-e5-large',
//   data: [
//     { values: [0.1, 0.2, ...], index: 0 },
//     { values: [0.2, 0.3, ...], index: 1 }
//   ],
//   usage: { totalTokens: 24 }
// }

// Generate query embeddings
const userQuery = ['How should I prepare my turkey?'];

const queryEmbeddings = await pc.inference.embed({
  model: embeddingModel,
  inputs: userQuery,
  parameters: {
    inputType: 'query',
    truncate: 'END',
  },
});

console.log(queryEmbeddings);
```

## Upsert embeddings

You can upsert the generated embeddings into your index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Generate embeddings
const embeddingModel = 'multilingual-e5-large';
const documents = [
  'Turkey is a classic meat to eat at American Thanksgiving.',
  'Many people enjoy the beautiful mosques in Turkey.',
];

const embeddings = await pc.inference.embed({
  model: embeddingModel,
  inputs: documents,
  parameters: { inputType: 'passage' },
});

// Upsert into index
const index = pc.index({ name: 'my-index' });
await index.upsert({
  records: embeddings.data.map((embedding, i) => ({
    id: `doc-${i}`,
    values: embedding.values,
    metadata: { text: documents[i] },
  })),
});
```

## Rerank documents

Rerank documents in descending relevance-order against a query. The `score` represents the absolute measure of relevance of a given query and passage pair. Normalized between [0, 1], the `score` represents how closely relevant a specific item and query are, with scores closer to 1 indicating higher relevance.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const rerankingModel = 'bge-reranker-v2-m3';
const myQuery = 'What are some good Turkey dishes for Thanksgiving?';

// Option 1: Documents as an array of strings
const myDocsStrings = [
  'I love turkey sandwiches with pastrami',
  'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
  'My favorite Thanksgiving dish is pumpkin pie',
  'Turkey is a great source of protein',
];

const response1 = await pc.inference.rerank({
  model: rerankingModel,
  query: myQuery,
  documents: myDocsStrings,
});

console.log(response1);
// {
//   model: 'bge-reranker-v2-m3',
//   data: [
//     { index: 1, score: 0.5633179, document: { text: '...' } },
//     { index: 2, score: 0.02013874, document: { text: '...' } },
//     { index: 3, score: 0.00035419367, document: { text: '...' } },
//     { index: 0, score: 0.00021485926, document: { text: '...' } }
//   ],
//   usage: { rerankUnits: 1 }
// }

// Option 2: Documents as an array of objects
const myDocsObjs = [
  {
    title: 'Turkey Sandwiches',
    body: 'I love turkey sandwiches with pastrami',
  },
  {
    title: 'Lemon Turkey',
    body: 'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
  },
  {
    title: 'Thanksgiving',
    body: 'My favorite Thanksgiving dish is pumpkin pie',
  },
  {
    title: 'Protein Sources',
    body: 'Turkey is a great source of protein',
  },
];

// Specify custom options
const response2 = await pc.inference.rerank({
  model: rerankingModel,
  query: myQuery,
  documents: myDocsObjs,
  topN: 3,
  returnDocuments: false,
  rankFields: ['body'],
  parameters: {
    inputType: 'passage',
    truncate: 'END',
  },
});

console.log(response2);
// {
//   model: 'bge-reranker-v2-m3',
//   data: [
//     { index: 1, score: 0.5633179, document: undefined },
//     { index: 2, score: 0.02013874, document: undefined },
//     { index: 3, score: 0.00035419367, document: undefined }
//   ],
//   usage: { rerankUnits: 1 }
// }
```

## Complete RAG example

Here's a complete example combining embedding, query, and reranking:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const embeddingModel = 'multilingual-e5-large';
const rerankModel = 'bge-reranker-v2-m3';

// 1. Generate and upsert document embeddings
const documents = [
  'Turkey is a classic meat to eat at American Thanksgiving.',
  'Many people enjoy the beautiful mosques in Turkey.',
  'Apple pie is a traditional American dessert.',
];

const docEmbeddings = await pc.inference.embed({
  model: embeddingModel,
  inputs: documents,
  parameters: { inputType: 'passage' },
});

const index = pc.index({ name: 'my-index' });
await index.upsert({
  records: docEmbeddings.data.map((embedding, i) => ({
    id: `doc-${i}`,
    values: embedding.values,
    metadata: { text: documents[i] },
  })),
});

// 2. Generate query embedding and search
const query = 'Tell me about Thanksgiving traditions';
const queryEmbedding = await pc.inference.embed({
  model: embeddingModel,
  inputs: [query],
  parameters: { inputType: 'query' },
});

const searchResults = await index.query({
  vector: queryEmbedding.data[0].values,
  topK: 10,
  includeMetadata: true,
});

// 3. Rerank the results
const docsToRerank = searchResults.matches.map(
  (match) => match.metadata?.text as string,
);

const reranked = await pc.inference.rerank({
  model: rerankModel,
  query: query,
  documents: docsToRerank,
  topN: 3,
});

console.log('Top reranked results:');
reranked.data.forEach((result) => {
  console.log(`Score: ${result.score}, Doc: ${result.document?.text}`);
});
```

For integrated inference where Pinecone handles embedding and reranking automatically, see [Integrated Inference](./integrated-inference.md).
