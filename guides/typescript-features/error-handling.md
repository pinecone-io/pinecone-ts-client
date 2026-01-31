# Error Handling

The Pinecone TypeScript SDK provides a hierarchy of error classes to help you handle different failure scenarios appropriately. All custom errors extend `BasePineconeError`.

For more information on error handling in production, see [Error handling](https://docs.pinecone.io/guides/production/error-handling).

## Error class hierarchy

The SDK includes the following error classes:

### HTTP Errors

- **`PineconeBadRequestError`** (400, 403) - Invalid request parameters or insufficient quota
- **`PineconeAuthorizationError`** (401) - Invalid or missing API key
- **`PineconeNotFoundError`** (404) - Resource not found
- **`PineconeConflictError`** (409) - Resource already exists
- **`PineconeInternalServerError`** (500) - Pinecone server error
- **`PineconeNotImplementedError`** (501) - Feature not available on your plan
- **`PineconeUnavailableError`** (503) - Service temporarily unavailable
- **`PineconeUnmappedHttpError`** - Unexpected HTTP error

### Configuration Errors

- **`PineconeConfigurationError`** - Invalid client configuration
- **`PineconeEnvironmentVarsNotSupportedError`** - Environment variable issue
- **`PineconeUnableToResolveHostError`** - Cannot resolve index host

### Request Errors

- **`PineconeConnectionError`** - Network connection failure
- **`PineconeRequestError`** - General request failure
- **`PineconeMaxRetriesExceededError`** - Exceeded maximum retry attempts

### Validation Errors

- **`PineconeArgumentError`** - Invalid function arguments

## Catching specific error types

Catch and handle specific errors to implement appropriate recovery strategies:

```typescript
import {
  Pinecone,
  PineconeAuthorizationError,
  PineconeNotFoundError,
  PineconeConnectionError,
  PineconeBadRequestError,
} from '@pinecone-database/pinecone';

async function handleSpecificErrors() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  try {
    const indexModel = await pc.describeIndex('my-index');
    const index = pc.index({ host: indexModel.host });
    const results = await index.query({
      vector: [0.1, 0.2, 0.3],
      topK: 10,
    });
    console.log(results);
  } catch (error) {
    if (error instanceof PineconeAuthorizationError) {
      console.error('Invalid API key. Please check your credentials.');
      // Prompt user to update API key
    } else if (error instanceof PineconeNotFoundError) {
      console.error('Index not found. Please create the index first.');
      // Create the index or use different index name
    } else if (error instanceof PineconeConnectionError) {
      console.error('Connection failed. Retrying...');
      // Implement retry logic
    } else if (error instanceof PineconeBadRequestError) {
      console.error('Invalid request parameters:', error.message);
      // Fix request parameters
    } else {
      console.error('Unexpected error:', error);
      throw error; // Re-throw if unhandled
    }
  }
}

handleSpecificErrors();
```

## Error properties

All Pinecone errors include helpful properties:

```typescript
import { Pinecone, BasePineconeError } from '@pinecone-database/pinecone';

async function examineErrorProperties() {
  const pc = new Pinecone({ apiKey: 'INVALID_KEY' });

  try {
    await pc.listIndexes();
  } catch (error) {
    if (error instanceof BasePineconeError) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // Access the cause if the error was wrapped
      if (error.cause) {
        console.error('Underlying cause:', error.cause);
      }
    }
  }
}

examineErrorProperties();
```

## Retry strategies

Implement retry logic for transient failures:

```typescript
import {
  Pinecone,
  PineconeConnectionError,
  PineconeInternalServerError,
  PineconeUnavailableError,
} from '@pinecone-database/pinecone';

async function retryableOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Only retry on transient errors
      const isRetryable =
        error instanceof PineconeConnectionError ||
        error instanceof PineconeInternalServerError ||
        error instanceof PineconeUnavailableError;

      if (isRetryable && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
  const indexModel = await pc.describeIndex('my-index');
  const index = pc.index({ host: indexModel.host });

  const results = await retryableOperation(() =>
    index.query({
      vector: [0.1, 0.2, 0.3],
      topK: 10,
    }),
  );

  return results;
}

queryWithRetry();
```

## Built-in retry configuration

The Pinecone client supports automatic retries for certain operations. Configure this when creating the client:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'YOUR_API_KEY',
  maxRetries: 5, // Retry up to 5 times (default is 3)
});

// Operations like upsert, update, and configureIndex will automatically retry
const indexModel = await pc.describeIndex('my-index');
const index = pc.index({ host: indexModel.host });
await index.upsert({
  records: [{ id: '1', values: [0.1, 0.2, 0.3] }],
});
```

## Validation errors

`PineconeArgumentError` is thrown when function arguments are invalid:

```typescript
import { Pinecone, PineconeArgumentError } from '@pinecone-database/pinecone';

async function handleValidationErrors() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const indexModel = await pc.describeIndex('my-index');
  const index = pc.index({ host: indexModel.host });

  try {
    // Missing required 'id' field
    await index.upsert({
      records: [
        {
          // @ts-expect-error - missing id
          values: [0.1, 0.2, 0.3],
        },
      ],
    });
  } catch (error) {
    if (error instanceof PineconeArgumentError) {
      console.error('Invalid arguments:', error.message);
      // Fix the arguments and retry
    }
  }
}

handleValidationErrors();
```

## Complete error handling example

Here's a comprehensive example showing robust error handling:

```typescript
import {
  Pinecone,
  PineconeAuthorizationError,
  PineconeNotFoundError,
  PineconeConnectionError,
  PineconeBadRequestError,
  PineconeConflictError,
  BasePineconeError,
} from '@pinecone-database/pinecone';

async function robustIndexOperation() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY', maxRetries: 3 });

  try {
    // Try to create an index
    await pc.createIndex({
      name: 'my-index',
      dimension: 1536,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
      suppressConflicts: true, // Don't throw if index exists
    });

    const indexModel = await pc.describeIndex('my-index');
    const index = pc.index({ host: indexModel.host });

    // Perform operations with proper error handling
    const results = await index.query({
      vector: [0.1, 0.2, 0.3],
      topK: 10,
    });

    return results;
  } catch (error) {
    if (error instanceof PineconeAuthorizationError) {
      console.error('Authentication failed. Check your API key.');
      process.exit(1);
    } else if (error instanceof PineconeNotFoundError) {
      console.error('Resource not found.');
      // Could create the resource here
    } else if (error instanceof PineconeConnectionError) {
      console.error('Connection failed. Check your network.');
      // Could retry or use fallback
    } else if (error instanceof PineconeBadRequestError) {
      console.error('Invalid request:', error.message);
      // Fix request parameters
    } else if (error instanceof PineconeConflictError) {
      console.log('Resource already exists, continuing...');
      // Not necessarily an error
    } else if (error instanceof BasePineconeError) {
      console.error('Pinecone error:', error.message);
      throw error;
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

robustIndexOperation();
```

## Logging and debugging

Enable debug logging to troubleshoot issues:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

// Set environment variable for debug logging
process.env.PINECONE_DEBUG = 'true';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Operations will now log detailed information
await pc.listIndexes();
```

You can also enable CURL command logging:

```typescript
// Log equivalent CURL commands for all requests
process.env.PINECONE_DEBUG_CURL = 'true';
```

## Best practices

1. **Catch specific errors**: Handle different error types appropriately
2. **Retry transient failures**: Implement exponential backoff for connection errors
3. **Use suppressConflicts**: For idempotent operations like `createIndex`
4. **Log errors**: Log errors with context for debugging
5. **Wrap errors**: When wrapping errors, preserve the original cause
6. **Check status page**: For 500/503 errors, check [status.pinecone.io](https://status.pinecone.io/)
7. **Validate early**: Catch validation errors before making API calls

## Error recovery patterns

### Create index with fallback

```typescript
import { Pinecone, PineconeConflictError } from '@pinecone-database/pinecone';

async function createOrUseExisting(name: string) {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  try {
    await pc.createIndex({
      name,
      dimension: 1536,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    console.log('Index created successfully');
  } catch (error) {
    if (error instanceof PineconeConflictError) {
      console.log('Index already exists, using existing index');
    } else {
      throw error;
    }
  }

  return pc.index({ host });
}
```

### Graceful degradation

```typescript
import { Pinecone, PineconeConnectionError } from '@pinecone-database/pinecone';

async function queryWithFallback() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const indexModel = await pc.describeIndex('my-index');
  const index = pc.index({ host: indexModel.host });

  try {
    const results = await index.query({
      vector: [0.1, 0.2, 0.3],
      topK: 10,
    });
    return results;
  } catch (error) {
    if (error instanceof PineconeConnectionError) {
      console.warn('Pinecone unavailable, using cached results');
      // Return cached results or empty response
      return { matches: [], namespace: '', usage: { readUnits: 0 } };
    }
    throw error;
  }
}
```

For more information on async patterns, see [Async Patterns](./async-patterns.md).
