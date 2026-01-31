# Pinecone TypeScript SDK &middot; ![License](https://img.shields.io/github/license/pinecone-io/pinecone-ts-client?color=orange) ![npm](https://img.shields.io/npm/v/%40pinecone-database%2Fpinecone?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40pinecone-database%2Fpinecone) ![npm](https://img.shields.io/npm/dw/%40pinecone-database/pinecone?style=flat&color=blue&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40pinecone-database%2Fpinecone) ![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/pinecone-io/pinecone-ts-client/pr.yml?label=CI&link=https%3A%2F%2Fgithub.com%2Fpinecone-io%2Fpinecone-ts-client%2Factions%2Fworkflows%2Fmerge.yml)

The official Pinecone TypeScript SDK for building vector search applications with AI/ML.

Pinecone is a vector database that makes it easy to add vector search to production applications. Use Pinecone to store, search, and manage high-dimensional vectors for applications like semantic search, recommendation systems, and RAG (Retrieval-Augmented Generation).

## Features

- **Vector Operations**: Store, query, and manage high-dimensional vectors with metadata filtering
- **Serverless & Pod Indexes**: Choose between serverless (auto-scaling) or pod-based (dedicated) indexes
- **Integrated Inference**: Built-in embedding and reranking models for end-to-end search workflows
- **Pinecone Assistant**: AI assistants powered by vector database capabilities
- **Type Safety**: Full TypeScript support with generic type parameters for metadata

## Table of Contents

- [Documentation](#documentation)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Productionizing](#productionizing)
- [Quickstart](#quickstart)
  - [Bringing your own vectors](#bringing-your-own-vectors-to-pinecone)
  - [Using integrated inference](#using-integrated-inference)
- [Pinecone Assistant](#pinecone-assistant)
- [More Information](#more-information-on-usage)
- [Issues & Bugs](#issues--bugs)
- [Contributing](#contributing)

## Documentation

- [**Conceptual docs and guides**](https://docs.pinecone.io)
- [**TypeScript Reference Documentation**](https://sdk.pinecone.io/typescript/classes/Pinecone.html)

### Upgrading the SDK

> [!NOTE]
> For notes on changes between major versions, see the migration guides:
> - [v2 Migration Guide](./guides/upgrading/v2-migration.md) - Upgrading from v1.x to v2.x
> - [v1 Migration Guide](./guides/upgrading/v1-migration.md) - Upgrading from v0.x to v1.x

## Prerequisites

- The Pinecone TypeScript SDK is compatible with TypeScript >=5.2.0 and Node.js >=20.0.0.
- Before you can use the Pinecone SDK, you must sign up for an account and find your API key in the Pinecone console dashboard at [https://app.pinecone.io](https://app.pinecone.io).

**Note for TypeScript users:** This SDK uses Node.js built-in modules in its type definitions. If you're using TypeScript, ensure you have `@types/node` installed in your project:

```bash
npm install --save-dev @types/node
```

## Installation

```bash
npm install @pinecone-database/pinecone
```

## Productionizing

The Pinecone TypeScript SDK is intended for **server-side use only**. Using the SDK within a browser context can **expose your API key(s)**. If you have deployed the SDK to production in a browser, **please rotate your API keys.**

## Quickstart

### Bringing your own vectors to Pinecone

This example shows how to create an index, add vectors with embeddings you've generated, and query them. This approach gives you full control over your embedding model and vector generation process.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

// 1. Instantiate the Pinecone client
// Option A: Pass API key directly
const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Option B: Use environment variable (PINECONE_API_KEY)
// const pc = new Pinecone();

// 2. Create a serverless index
await pc.createIndex({
  name: 'example-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
});

// 3. Target the index
const index = pc.index({ name: 'example-index' });

// 4. Upsert vectors with metadata
await index.upsert({
  records: [
    {
      id: 'vec1',
      values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], // ... dimension should match index (1536)
      metadata: { genre: 'drama', year: 2020 },
    },
    {
      id: 'vec2',
      values: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
      metadata: { genre: 'action', year: 2021 },
    },
  ],
});

// 5. Query the index
const queryResponse = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], // ... query vector
  topK: 3,
  includeMetadata: true,
});

console.log(queryResponse);
```

### Using integrated inference

This example demonstrates using Pinecone's integrated inference capabilities. You provide raw text data, and Pinecone handles embedding generation and optional reranking automatically. This is ideal when you want to focus on your data and let Pinecone handle the ML complexity.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

// 1. Instantiate the Pinecone client
const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// 2. Create an index configured for use with a particular embedding model
await pc.createIndexForModel({
  name: 'example-index',
  cloud: 'aws',
  region: 'us-east-1',
  embed: {
    model: 'multilingual-e5-large',
    fieldMap: { text: 'chunk_text' },
  },
  waitUntilReady: true,
});

// 3. Target the index
const index = pc.index({ name: 'example-index' });

// 4. Upsert records with raw text data
// Pinecone will automatically generate embeddings using the configured model
await index.upsertRecords({
  records: [
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
  ],
});

// 5. Search for similar records using text queries
// Pinecone handles embedding the query and optionally reranking results
const searchResponse = await index.searchRecords({
  query: {
    inputs: { text: 'Apple corporation' },
    topK: 3,
  },
  rerank: {
    model: 'bge-reranker-v2-m3',
    topN: 2,
    rankFields: ['chunk_text'],
  },
});

console.log(searchResponse);
```

## Pinecone Assistant

The [Pinecone Assistant API](https://docs.pinecone.io/guides/assistant/understanding-assistant) enables you to create and manage AI assistants powered by Pinecone's vector database capabilities. These Assistants can be customized with specific instructions and metadata, and can interact with files and engage in chat conversations.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

// Create an assistant
const assistant = await pc.createAssistant({
  name: 'product-assistant',
  instructions: 'You are a helpful product recommendation assistant.',
});

// Target the assistant for data operations
const myAssistant = pc.assistant({ name: 'product-assistant' });

// Upload a file
await myAssistant.uploadFile({
  path: 'product-catalog.txt',
  metadata: { source: 'catalog' },
});

// Chat with the assistant
const response = await myAssistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What products do you recommend for outdoor activities?',
    },
  ],
});

console.log(response.message.content);
```

For more information on Pinecone Assistant, see the [Pinecone Assistant documentation](https://docs.pinecone.io/guides/assistant/understanding-assistant).

## More information on usage

Detailed information on specific ways of using the SDK are covered in these guides:

**Index Management:**

- [Serverless Indexes](./guides/index-management/serverless-indexes.md) - Create and manage auto-scaling serverless indexes
- [Pod Indexes](./guides/index-management/pod-indexes.md) - Create and manage dedicated pod-based indexes
- [Collections](./guides/index-management/collections.md) - Static copies of pod-based indexes
- [Backups](./guides/index-management/backups.md) - Create and restore from serverless index backups
- [Common Operations](./guides/index-management/shared-operations.md) - List, describe, delete, and configure indexes

**Data Operations:**

- [Working with Vectors](./guides/data-operations/working-with-vectors.md) - Upsert, query, fetch, update, and delete vectors
- [Namespaces](./guides/data-operations/namespaces.md) - Organize vectors within an index
- [Metadata Filtering](./guides/data-operations/metadata-filtering.md) - Advanced filtering with operators
- [Bulk Import](./guides/data-operations/bulk-import.md) - Import large datasets from object storage

**Inference:**

- [Inference API](./guides/inference/inference-api.md) - Use standalone embedding and reranking models
- [Integrated Inference](./guides/inference/integrated-inference.md) - Index-integrated embedding and reranking

**Assistant:**

- [Getting Started](./guides/assistant/getting-started.md) - Quick start guide for Pinecone Assistant
- [Chat Operations](./guides/assistant/chat.md) - Chat, streaming, and context retrieval
- [File Management](./guides/assistant/file-management.md) - Upload, list, and manage files

**TypeScript Features:**

- [Type Safety](./guides/typescript-features/type-safety.md) - Generic metadata types and type-safe operations
- [Async Patterns](./guides/typescript-features/async-patterns.md) - Best practices for async/await
- [Error Handling](./guides/typescript-features/error-handling.md) - Error types and recovery strategies

**Additional Resources:**

- [FAQ](./guides/faq.md) - Frequently asked questions and troubleshooting

# Issues & Bugs

If you notice bugs or have feedback, please [file an issue](https://github.com/pinecone-io/pinecone-ts-client/issues).

You can also get help in the [Pinecone Community Forum](https://community.pinecone.io/).

# Contributing

If you'd like to make a contribution, or get setup locally to develop the Pinecone TypeScript SDK, please see our [contributing guide](https://github.com/pinecone-io/pinecone-ts-client/blob/main/CONTRIBUTING.md)
