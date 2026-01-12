# Caller Configuration Usage Example

## Overview

The Pinecone TypeScript SDK now supports optional caller configuration parameters that allow you to pass information about the LLM model and model provider being used. This information is captured for telemetry purposes via the User-Agent header.

## Configuration Options

Two new optional configuration fields have been added to `PineconeConfiguration`:

- `callerModel`: The LLM model being used (e.g., 'gpt-4', 'claude-3-opus', 'gemini-pro')
- `callerModelProvider`: The model provider (e.g., 'openai', 'anthropic', 'google')

## Usage Examples

### Basic Usage with OpenAI

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'gpt-4',
  callerModelProvider: 'openai'
});
```

### Using with Anthropic Claude

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'claude-3-opus',
  callerModelProvider: 'anthropic'
});
```

### Using with Google Gemini

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'gemini-1.5-pro',
  callerModelProvider: 'google'
});
```

### Combined with Other Configuration Options

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your-api-key',
  sourceTag: 'my-rag-application',
  callerModel: 'gpt-4-turbo',
  callerModelProvider: 'openai',
  maxRetries: 5
});
```

## User-Agent Header Format

When these configuration options are provided, they are automatically included in the User-Agent header sent with all requests to Pinecone:

```
@pinecone-database/pinecone v6.1.3; lang=typescript; node v18.0.0; caller_model_provider=openai; caller_model=gpt-4
```

## Value Normalization

Both `callerModel` and `callerModelProvider` values are automatically normalized:
- Converted to lowercase
- Only alphanumeric characters, underscores, dots, and hyphens are preserved
- Spaces are replaced with underscores
- Leading and trailing spaces are trimmed

### Examples:

- `"GPT-4"` → `"gpt-4"`
- `"Claude 3 Opus"` → `"claude_3_opus"`
- `"Gemini-1.5-Pro"` → `"gemini-1.5-pro"`
- `"  OpenAI  "` → `"openai"`

## Benefits

By providing this information, you help Pinecone:
- Better understand how the SDK is being used with different LLM providers
- Improve the SDK based on real-world usage patterns
- Provide better support and documentation for common LLM integration scenarios
- Track adoption and usage trends across different AI platforms

## Optional Nature

Both fields are completely optional. If not provided, the SDK will work exactly as before with no impact on functionality.
