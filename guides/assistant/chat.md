# Chat Operations

This guide covers chat operations with Pinecone Assistant, including standard chat, OpenAI-compatible chat, streaming, and context retrieval.

For guidance and examples, see [Chat with an assistant](https://docs.pinecone.io/guides/assistant/chat-with-assistant).

## Standard chat

The `chat` method is the recommended way to chat with an Assistant, as it offers more functionality and control over the assistant's responses and references:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
});

console.log(response);
// {
//   id: '000000000000000023e7fb015be9d0ad',
//   finishReason: 'stop',
//   message: {
//     role: 'assistant',
//     content: 'The capital of France is Paris.'
//   },
//   model: 'gpt-4o',
//   citations: [ { position: 209, references: [Array] } ],
//   usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
// }
```

## Choose a model

You can specify which large language model to use for answer generation. The default is `gpt-4o`. Available models include:

- `gpt-4o` (default)
- `gpt-4.1`
- `gpt-5`
- `o4-mini`
- `claude-sonnet-4-5`
- `gemini-2.5-pro`

For chat applications, GPT models (`gpt-4o`, `gpt-4.1`, `gpt-5`, or `o4-mini`) typically provide faster response times compared to other models.

**Note:** Anthropic has deprecated the Claude 3.5 Sonnet and Claude 3.7 Sonnet models. Assistant automatically routes chat requests that specify `claude-3-5-sonnet` or `claude-3-7-sonnet` to `claude-sonnet-4-5` at the same price.

The SDK provides a `ChatModelEnum` for convenience:

```typescript
import { Pinecone, ChatModelEnum } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'Summarize this document',
    },
  ],
  model: ChatModelEnum.ClaudeSonnet45, // 'claude-sonnet-4-5'
  // Other options: 'gpt-4o', 'gpt-4.1', 'o4-mini', 'gemini-2.5-pro'
});
```

## Control response randomness

Use the `temperature` parameter to control the randomness of responses. Lower values (0.0-0.5) make responses more deterministic and focused, while higher values (0.5-1.0) increase creativity and variability:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'Write a creative story about AI',
    },
  ],
  temperature: 0.8, // Higher temperature for creative responses
});
```

## Get JSON responses

Request structured JSON responses by setting `jsonResponse: true`. This is useful when you need to parse the assistant's response programmatically:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'Extract key metrics from the financial report as JSON',
    },
  ],
  jsonResponse: true,
});

// The response.message.content will be valid JSON
const metrics = JSON.parse(response.message.content);
```

## Include document highlights

Request highlighted excerpts from source documents that support the assistant's response:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What were the main findings?',
    },
  ],
  includeHighlights: true,
});

// Citations will include highlights showing the exact text that supports the response
response.citations?.forEach((citation) => {
  citation.references?.forEach((ref) => {
    if (ref.highlight) {
      console.log(`Highlight: ${ref.highlight.content}`);
    }
  });
});
```

## Control context retrieval

Use `contextOptions` to fine-tune how the assistant retrieves and uses context from your documents:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'Analyze the charts and graphs in the report',
    },
  ],
  contextOptions: {
    topK: 32, // Retrieve more context snippets (default: 16, max: 64)
    snippetSize: 4096, // Larger snippets (default: 2048, max: 8192 tokens)
    multimodal: true, // Include image-related context
    includeBinaryContent: true, // Include base64 image data
  },
});
```

Context options:
- **`topK`**: Maximum number of context snippets to retrieve (default: 16, max: 64)
- **`snippetSize`**: Maximum token size per snippet (default: 2048, min: 512, max: 8192)
- **`multimodal`**: Whether to retrieve image-related context (default: true)
- **`includeBinaryContent`**: Whether to include base64 image data in image snippets (default: true, only when `multimodal: true`)

## OpenAI-compatible chat completion

The `chatCompletion` method is based on the [OpenAI Chat Completion](https://platform.openai.com/docs/api-reference/chat) format, useful if you need OpenAI-compatible responses. However, it has limited functionality compared to the standard `chat` method.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chatCompletion({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
});

console.log(response);
// {
//   id: '000000000000000023e7fb015be9d0ad',
//   choices: [
//     {
//       finishReason: 'stop',
//       index: 0,
//       message: {
//         role: 'assistant',
//         content: 'The capital of France is Paris.'
//       }
//     }
//   ],
//   model: 'gpt-4o-2024-05-13',
//   usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
// }
```

## Streaming responses

Assistant chat responses can be streamed using the `chatStream` and `chatCompletionStream` methods. These methods return a `ChatStream` which implements `AsyncIterable`, allowing for manipulation of the stream.

### Chat stream

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const chatStream = await assistant.chatStream({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
});

for await (const chunk of chatStream) {
  console.log(chunk);
}
// Each chunk in the stream will have a different shape depending on the type:
//
// { type: 'message_start', id: 'response_id', model: 'gpt-4o-2024-05-13', role: 'assistant' }
// { type: 'content_chunk', id: 'response_id', model: 'gpt-4o-2024-05-13', delta: { content: 'The' } }
// { type: 'content_chunk', id: 'response_id', model: 'gpt-4o-2024-05-13', delta: { content: ' capital' } }
// { type: 'content_chunk', id: 'response_id', model: 'gpt-4o-2024-05-13', delta: { content: ' of France' } }
// { type: 'content_chunk', id: 'response_id', model: 'gpt-4o-2024-05-13', delta: { content: ' is Paris.' } }
// { type: 'citation', id: 'response_id', model: 'gpt-4o-2024-05-13', citation: { position: 1538, references: [...] } }
// { type: 'message_end', id: 'response_id', model: 'gpt-4o-2024-05-13', finishReason: 'stop', usage: {...} }
```

### Chat completion stream

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const chatCompletionStream = await assistant.chatCompletionStream({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
});

for await (const chunk of chatCompletionStream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
// Each chunk will have the OpenAI-compatible completion shape
```

## Conversation Context

You can maintain conversation context by including previous messages:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response1 = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
});

// Continue the conversation
const response2 = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
    {
      role: 'assistant',
      content: response1.message.content,
    },
    {
      role: 'user',
      content: 'What is the population of that city?',
    },
  ],
});
```

## Filter by metadata

Filter which documents the assistant can access using metadata. Assistant metadata filtering uses a query language with operators like `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$and`, and `$or`.

For complete details on the metadata query language, see [Metadata query language](https://docs.pinecone.io/guides/assistant/files-overview#metadata-query-language).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What were the Q4 results?',
    },
  ],
  filter: {
    $and: [
      { year: { $eq: 2024 } },
      { quarter: { $eq: 'Q4' } },
      { document_type: { $eq: 'financial_report' } },
    ],
  },
});
```

For simpler filters with a single condition, you can omit the `$and`:

```typescript
// Filter for documents where genre equals "documentary"
const response = await assistant.chat({
  messages: ['Tell me about nature films'],
  filter: { genre: { $eq: 'documentary' } },
});

// Filter using $in operator
const response = await assistant.chat({
  messages: ['Summarize recent research'],
  filter: { genre: { $in: ['research', 'academic', 'technical'] } },
});
```

## Retrieve context snippets

Returns context snippets associated with a given query and an Assistant's response. This is useful for understanding how the Assistant arrived at its answer or for implementing custom RAG workflows.

For more information, see [Understanding context snippets](https://docs.pinecone.io/guides/assistant/understanding-context-snippets).

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const context = await assistant.context({
  messages: ['What is the capital of France?'],
  topK: 20,
  snippetSize: 3072,
  multimodal: true,
  includeBinaryContent: true,
});

console.log(context);
// {
//   snippets: [
//     {
//       type: 'text',
//       content: 'The capital of France is Paris.',
//       score: 0.9978925,
//       reference: { ... }
//     }
//   ],
//   usage: { promptTokens: 527, completionTokens: 0, totalTokens: 527 }
// }
```

You can also filter context retrieval by metadata:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const context = await assistant.context({
  query: 'quantum computing applications',
  topK: 10,
  snippetSize: 1024,
  filter: {
    $and: [
      { document_type: { $eq: 'research_paper' } },
      { published_year: { $eq: 2024 } },
    ],
  },
});
```

## Working with citations

The standard `chat` method returns citations that reference the source material used to generate the response:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'Tell me about your products',
    },
  ],
});

// Access citations
response.citations?.forEach((citation) => {
  console.log(`Position: ${citation.position}`);
  citation.references?.forEach((ref) => {
    console.log(`  File: ${ref.file?.name}`);
    console.log(`  Text: ${ref.text}`);
  });
});
```

For more details on file management, see [File Management](./file-management.md).
