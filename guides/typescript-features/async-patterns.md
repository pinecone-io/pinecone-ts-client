# Async Patterns

The Pinecone TypeScript SDK is fully async and uses modern async/await patterns. This guide covers best practices for working with asynchronous operations.

## Basic async/await

All SDK methods return Promises and should be awaited:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function basicExample() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  // Always await SDK operations
  const list = await pc.listIndexes();
  console.log(list.indexes);
}

basicExample();
```

## Error handling with try/catch

Wrap async operations in try/catch blocks to handle errors:

```typescript
import { Pinecone, PineconeConnectionError } from '@pinecone-database/pinecone';

async function errorHandlingExample() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  try {
    const index = pc.index({ name: 'my-index' });
    const results = await index.query({
      vector: [0.1, 0.2, 0.3],
      topK: 10,
    });
    console.log(results);
  } catch (error) {
    if (error instanceof PineconeConnectionError) {
      console.error('Failed to connect to Pinecone:', error.message);
      // Handle connection error
    } else {
      console.error('Unexpected error:', error);
      // Handle other errors
    }
  }
}

errorHandlingExample();
```

## Parallel operations with Promise.all

When you need to perform multiple independent operations, use `Promise.all` for better performance:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function parallelOperations() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  // Fetch multiple vectors in parallel
  const [vec1, vec2, vec3] = await Promise.all([
    index.fetch({ ids: ['1'] }),
    index.fetch({ ids: ['2'] }),
    index.fetch({ ids: ['3'] }),
  ]);

  // Or perform different operations in parallel
  const [stats, description, namespaces] = await Promise.all([
    index.describeIndexStats(),
    pc.describeIndex('my-index'),
    index.listNamespaces(),
  ]);

  console.log({ stats, description, namespaces });
}

parallelOperations();
```

## Batch operations

When upserting or querying multiple items, batch them for efficiency:

```typescript
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

async function batchOperations() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  // Prepare all records first
  const records: PineconeRecord[] = Array.from({ length: 100 }, (_, i) => ({
    id: `vec${i}`,
    values: Array.from({ length: 1536 }, () => Math.random()),
    metadata: { batch: 1, index: i },
  }));

  // Upsert in batches of 100 (recommended batch size)
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.upsert({ records: batch });
    console.log(`Upserted batch ${i / batchSize + 1}`);
  }
}

batchOperations();
```

## Sequential operations with dependencies

When operations depend on each other, chain them sequentially:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function sequentialOperations() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  // Create index and wait for it to be ready
  await pc.createIndex({
    name: 'new-index',
    dimension: 1536,
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
    waitUntilReady: true,
  });

  // Now we can safely perform data operations
  const index = pc.index({ name: 'new-index' });

  await index.upsert({
    records: [{ id: '1', values: [0.1, 0.2, 0.3] }],
  });

  // Query the data we just upserted
  const results = await index.query({
    id: '1',
    topK: 5,
  });

  console.log(results);
}

sequentialOperations();
```

## Retry patterns

Implement custom retry logic for transient failures:

```typescript
import { Pinecone, PineconeConnectionError } from '@pinecone-database/pinecone';

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (
        error instanceof PineconeConnectionError &&
        attempt < maxRetries - 1
      ) {
        console.log(
          `Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }

  throw lastError!;
}

// Usage
async function queryWithRetry() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  const results = await retryOperation(
    () =>
      index.query({
        vector: [0.1, 0.2, 0.3],
        topK: 10,
      }),
    3, // Max 3 retries
    1000, // Start with 1 second delay
  );

  return results;
}
```

## Timeout handling

Implement timeouts for long-running operations:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out',
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Usage
async function queryWithTimeout() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  try {
    const results = await withTimeout(
      index.query({
        vector: [0.1, 0.2, 0.3],
        topK: 10,
      }),
      5000, // 5 second timeout
      'Query operation timed out after 5 seconds',
    );

    console.log(results);
  } catch (error) {
    console.error(error);
  }
}

queryWithTimeout();
```

## Async iteration for streams

When working with streaming Assistant responses, use async iteration:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function streamingExample() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const assistant = pc.assistant({ name: 'my-assistant' });

  const stream = await assistant.chatStream({
    messages: [
      {
        role: 'user',
        content: 'Tell me a story',
      },
    ],
  });

  // Use for-await-of to process stream chunks
  for await (const chunk of stream) {
    if (chunk.type === 'content_chunk' && chunk.delta?.content) {
      process.stdout.write(chunk.delta.content);
    }
  }
}

streamingExample();
```

## Promise chaining

While async/await is preferred, you can also use promise chaining:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

pc.createIndex({
  name: 'new-index',
  dimension: 1536,
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
  waitUntilReady: true,
})
  .then(() => {
    const index = pc.index({ name: 'new-index' });
    return index.upsert({
      records: [{ id: '1', values: [0.1, 0.2, 0.3] }],
    });
  })
  .then(() => {
    console.log('Upsert complete');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

## Best practices

1. **Always await**: Don't forget to await async operations
2. **Handle errors**: Use try/catch for all async operations
3. **Parallel when possible**: Use `Promise.all` for independent operations
4. **Batch operations**: Group multiple items into single requests
5. **Retry transient failures**: Implement retry logic for network errors
6. **Use timeouts**: Add timeouts for operations that might hang
7. **Reuse client instances**: Create the Pinecone client once and reuse it

For more information on error handling, see [Error Handling](./error-handling.md).
