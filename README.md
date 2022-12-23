# Pinecone Typescript Client

This is the Typescript client for Pinecone. It is a wrapper around the Pinecone OpenAPI spec.

## Installation

1. Clone the repo and run `npm install` to install dependencies.
2. In your project, run `npm install <path to pinecone-ts-client>` to install the client.

## Usage

Set the following envrionment variables:

```bash
export PINECONE_API_KEY=your_api_key
export PINECONE_INDEX=your_index
export PINECONE_ENVIRONMENT=your_environment
```

Then, in your code:

```typescript
import { PineconeClient } from "pinecone-ts-client";

// Create a client
const client = new PineconeClient();

// Initialize the client
await client.init({
  apiKey: process.env.PINECONE_API_KEY,
  index: process.env.PINECONE_INDEX,
  environment: process.env.PINECONE_ENVIRONMENT,
});

// List all indexes
const indexes = await client.listIndexes();
console.log(indexes.data);
```
