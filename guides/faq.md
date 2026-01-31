# FAQ

## How should I structure my Pinecone client instances?

You should create a single `Pinecone` client instance and reuse it throughout your application rather than creating a new instance for every operation.

**Benefits of reusing the client:**

- Avoids unnecessary object instantiation overhead
- Maintains consistent configuration (API key, retry settings, etc.)
- Better code organization

```typescript
// ✅ Good: Reuse client instance
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

async function query1() {
  const index = pc.index({ name: 'my-index' });
  return await index.query({ vector: [0.1, 0.2], topK: 10 });
}

async function query2() {
  const index = pc.index({ name: 'my-index' });
  return await index.query({ vector: [0.2, 0.3], topK: 10 });
}

// ❌ Bad: Creating new client for each operation
async function badQuery() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' }); // Don't do this repeatedly!
  const index = pc.index({ name: 'my-index' });
  return await index.query({ vector: [0.1, 0.2], topK: 10 });
}
```

## When are network requests made?

No network requests are made when instantiating the client with `new Pinecone()`. Network requests only occur when you invoke operations like `upsert`, `query`, `listIndexes`, etc.

The SDK uses the native `fetch` API (available in Node.js 18+ and Edge runtimes), which handles HTTP connection management automatically.

## Should I use environment variables or pass configuration in code?

Both approaches are valid. Choose based on your deployment strategy:

**Environment variables** (recommended for production):

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

// Reads from PINECONE_API_KEY environment variable
const pc = new Pinecone();
```

**Configuration object** (useful for testing or multi-project scenarios):

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'YOUR_API_KEY',
  maxRetries: 5,
});
```

## Should I target an index by name or host?

**By name** (convenient for development):

```typescript
const index = pc.index({ name: 'my-index' });
// SDK will call describeIndex to resolve the host
```

**By host** (better for production):

```typescript
const index = pc.index({
  host: 'my-index-abc123.svc.us-east-1-aws.pinecone.io',
});
// Avoids extra API call to resolve host
```

For production, look up the host once (via `describeIndex` or the console) and store it as an environment variable to remove the runtime dependency on control plane calls.

## How do I verify my API key is valid?

Call `listIndexes()` to verify connectivity and API key validity:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function verifyConnection() {
  try {
    const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
    const indexes = await pc.listIndexes();
    console.log('Connection successful! Indexes:', indexes.indexes.length);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

verifyConnection();
```

## What TypeScript version is required?

The SDK requires TypeScript >=5.2.0 and Node.js >=20.0.0.

You must also have `@types/node` installed as a dev dependency:

```bash
npm install --save-dev @types/node
```

## Why am I getting TypeScript compilation errors?

Common causes and solutions:

### Missing @types/node

```bash
npm install --save-dev @types/node
```

### Incompatible TypeScript version

Check your TypeScript version:

```bash
npx tsc --version
```

Upgrade if needed:

```bash
npm install --save-dev typescript@latest
```

### Strict null checks

Enable strict null checking in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

## Can I use this SDK in the browser?

**No.** The Pinecone TypeScript SDK is intended for server-side use only. Using the SDK in a browser can expose your API key.

Supported environments:

- ✅ Node.js (>=20.0.0)
- ✅ Edge runtimes (Vercel Edge Functions, Cloudflare Workers)
- ❌ Browser (client-side)

## How do I handle large upserts?

Batch your upserts for optimal performance:

```typescript
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

async function batchUpsert(records: PineconeRecord[], batchSize: number = 100) {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.upsert({ records: batch });
    console.log(`Upserted ${i + batch.length} / ${records.length} records`);
  }
}
```

For very large datasets (millions of vectors), consider using the [bulk import](../data-operations/bulk-import.md) feature.

## Why are my queries slow?

Common causes and solutions:

1. **Creating new client instances**: Reuse the same `Pinecone` client instance to avoid unnecessary instantiation overhead
2. **Targeting by name**: Use `host` instead of `name` to avoid extra API calls
3. **Large metadata**: Use metadata schema configuration to index only necessary fields
4. **Not using namespaces**: Partition data with namespaces for faster queries
5. **Including unnecessary data**: Set `includeValues: false` and `includeMetadata: false` if not needed

See the [performance tuning guide](https://docs.pinecone.io/guides/operations/performance-tuning) for more optimization strategies.

## How do I handle concurrent requests?

The SDK handles concurrent requests safely. Use `Promise.all` for parallel operations:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function concurrentQueries() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index({ name: 'my-index' });

  const queries = [
    [0.1, 0.2, 0.3],
    [0.2, 0.3, 0.4],
    [0.3, 0.4, 0.5],
  ];

  // Execute all queries in parallel
  const results = await Promise.all(
    queries.map((vector) =>
      index.query({
        vector,
        topK: 10,
      }),
    ),
  );

  return results;
}

concurrentQueries();
```

## What's the difference between `upsert` and `upsertRecords`?

- **`upsert`**: For vectors you've already embedded (bring your own vectors)
- **`upsertRecords`**: For text data with integrated inference (Pinecone generates embeddings)

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Use upsert when you have vectors
const index1 = pc.index({ name: 'byov-index' });
await index1.upsert({
  records: [{ id: '1', values: [0.1, 0.2, 0.3] }],
});

// Use upsertRecords with integrated inference indexes
const index2 = pc.index({ name: 'integrated-index' });
await index2.upsertRecords({
  records: [{ id: '1', text: 'This text will be embedded automatically' }],
});
```

## Can I use the SDK with a proxy?

Yes, you can provide a custom `fetch` implementation that supports proxies:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'YOUR_API_KEY',
  fetchApi: customFetchWithProxy, // Your custom fetch implementation
});
```

For Node.js environments, you can use libraries like `undici` or `node-fetch` with proxy agents. Refer to your proxy library's documentation for configuration details.

## Where can I find more help?

- [API Reference](https://sdk.pinecone.io/typescript/classes/Pinecone.html) - Complete API documentation
- [Official Docs](https://docs.pinecone.io) - Conceptual guides and tutorials
- [GitHub Issues](https://github.com/pinecone-io/pinecone-ts-client/issues) - Report bugs or request features
- [Community Forum](https://community.pinecone.io/) - Get help from the community
- [Status Page](https://status.pinecone.io/) - Check service health
