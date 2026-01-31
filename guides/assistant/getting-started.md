# Getting Started with Pinecone Assistant

The [Pinecone Assistant API](https://docs.pinecone.io/guides/assistant/understanding-assistant) enables you to create and manage AI assistants powered by Pinecone's vector database capabilities. These Assistants can be customized with specific instructions and metadata, and can interact with files and engage in chat conversations.

## Create an Assistant

Create a new Assistant with specified configurations. You can define the Assistant's name, provide instructions that guide its behavior, and attach metadata for organization and tracking purposes.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const assistant = await pc.createAssistant({
  name: 'product-assistant',
  instructions: 'You are a helpful product recommendation assistant.',
  metadata: {
    team: 'product',
    version: '1.0',
  },
});

console.log(assistant);
// {
//   name: 'product-assistant',
//   instructions: 'You are a helpful product recommendation assistant.',
//   metadata: { team: 'product', version: '1.0' },
//   status: 'Ready',
//   host: 'https://prod-1-data.ke.pinecone.io',
//   createdAt: '2025-01-08T22:24:50.525Z',
//   updatedAt: '2025-01-08T22:24:52.303Z'
// }
```

## Upload a file

You must upload at least one file in order to chat with an Assistant. Files provide the knowledge base for the assistant to answer questions.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'product-assistant' });

await assistant.uploadFile({
  path: 'product-catalog.txt',
  metadata: { source: 'catalog', version: '2025-01' },
});

// {
//   name: 'product-catalog.txt',
//   id: '921ad74c-2421-413a-8c86-fca81ceabc5c',
//   metadata: { source: 'catalog', version: '2025-01' },
//   createdOn: '2025-01-06T19:14:21.969Z',
//   updatedOn: '2025-01-06T19:14:21.969Z',
//   status: 'Processing',
//   percentDone: null
// }
```

## Chat with an Assistant

Once you have created an assistant and uploaded at least one file, you can start chatting:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'product-assistant' });

const response = await assistant.chat({
  messages: [
    {
      role: 'user',
      content: 'What products do you recommend for outdoor activities?',
    },
  ],
  model: 'gpt-4o', // Optional: specify the model (default: 'gpt-4o')
  temperature: 0.2, // Optional: control response randomness (0.0-1.0)
});

console.log(response);
// {
//   id: '000000000000000023e7fb015be9d0ad',
//   finishReason: 'stop',
//   message: {
//     role: 'assistant',
//     content: 'Based on your catalog, I recommend...'
//   },
//   model: 'gpt-4o',
//   citations: [ { position: 209, references: [Array] } ],
//   usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
// }
```

## List Assistants

Retrieve a list of all Assistants in your account:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const assistants = await pc.listAssistants();
console.log(assistants);
// {
//   assistants: [
//     {
//       name: 'product-assistant',
//       instructions: 'You are a helpful product recommendation assistant.',
//       metadata: { team: 'product', version: '1.0' },
//       status: 'Ready',
//       host: 'product-assistant-abc123.svc.pinecone.io'
//     }
//   ]
// }
```

## Update an Assistant

Update an Assistant's instructions or metadata:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.updateAssistant({
  name: 'product-assistant',
  instructions:
    'You are a helpful product recommendation assistant. Be concise and friendly.',
  metadata: { version: '2.0' },
});
```

## Get information about an Assistant

Retrieve information about a specific Assistant:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const info = await pc.describeAssistant('product-assistant');
console.log(info);
// {
//   name: 'product-assistant',
//   instructions: 'You are a helpful product recommendation assistant.',
//   metadata: { team: 'product', version: '2.0' },
//   status: 'Ready',
//   host: 'https://prod-1-data.ke.pinecone.io',
//   createdAt: '2025-01-08T22:24:50.525Z',
//   updatedAt: '2025-01-09T10:15:30.123Z'
// }
```

## Delete an Assistant

Delete an Assistant by name. Note that deleting an Assistant also deletes all associated files.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.deleteAssistant('product-assistant');
```

## Complete quickstart example

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function assistantQuickstart() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

  // 1. Create an assistant
  await pc.createAssistant({
    name: 'my-assistant',
    instructions: 'You are a helpful assistant.',
  });

  // 2. Target the assistant
  const assistant = pc.assistant({ name: 'my-assistant' });

  // 3. Upload a file
  await assistant.uploadFile({
    path: 'knowledge-base.txt',
  });

  // 4. Wait for file to be processed (check status)
  const files = await assistant.listFiles();
  console.log(files.files[0].status); // 'Available' when ready

  // 5. Chat with the assistant
  const response = await assistant.chat({
    messages: [
      {
        role: 'user',
        content: 'What can you tell me about the information in the file?',
      },
    ],
  });

  console.log(response.message.content);
}

assistantQuickstart();
```

For more details on chat operations and streaming, see [Chat Operations](./chat.md).

For file management operations, see [File Management](./file-management.md).
