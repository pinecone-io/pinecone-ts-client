# File Management

This guide covers operations for managing files within a Pinecone Assistant, including uploading, upserting, listing, describing, deleting files, and polling the async operations those mutations return.

For more information, see [Manage files](https://docs.pinecone.io/guides/assistant/manage-files).

## Upload a file

Upload a local file to an Assistant. You can attach metadata to the file for organization and filtering purposes. `uploadFile` returns an `OperationModel` — the file is processed asynchronously, so use `describeOperation` to poll until it is ready.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const operation = await assistant.uploadFile({
  path: 'product-catalog.txt',
  metadata: {
    source: 'catalog',
    version: '2025-01',
    category: 'products',
  },
});

console.log(operation);
// {
//   id: 'op-921ad74c-...',
//   operationType: 'upload',
//   fileId: '921ad74c-2421-413a-8c86-fca81ceabc5c',
//   status: 'Processing',
//   createdOn: 2025-01-06T19:14:21.969Z,
//   percentComplete: 0,
// }
```

## Upload files with multimodal processing

For PDF files containing images, charts, or diagrams, enable multimodal processing to extract and index visual content:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const operation = await assistant.uploadFile({
  path: 'quarterly-report-with-charts.pdf',
  multimodal: true,
  metadata: {
    document_type: 'financial_report',
    quarter: 'Q4',
    year: 2024,
  },
});
```

When `multimodal: true`, the assistant will:

- Extract images, charts, and diagrams from the PDF
- Generate captions for visual content
- Enable the assistant to answer questions about visual elements
- Allow you to retrieve image-related context snippets

## Upsert a file

Create or replace a file at a caller-supplied ID. Unlike `uploadFile`, the ID is stable and does not change on repeated calls — if a file with that ID already exists its content is replaced. `upsertFile` does not accept metadata.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const operation = await assistant.upsertFile({
  assistantFileId: 'openapi-spec',
  path: './openapi-2026-04.yaml',
});

console.log(operation.fileId); // 'openapi-spec'
console.log(operation.status); // 'Processing'
```

## Polling async operations

`uploadFile`, `upsertFile`, and `deleteFile` all return an `OperationModel` immediately. The underlying file operation is processed asynchronously. Use `describeOperation` to check progress:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const operation = await assistant.uploadFile({ path: 'report.pdf' });

// Poll until complete
let op = operation;
while (op.status === 'Processing') {
  await new Promise((r) => setTimeout(r, 2000));
  op = await assistant.describeOperation({ operationId: operation.id });
}

if (op.status === 'Completed') {
  console.log('File is ready. Ingestion units used:', op.ingestionUnits);
} else {
  console.error('Upload failed:', op.errorMessage);
}
```

### Operation status values

- `Processing` — operation is in progress
- `Completed` — operation finished successfully; the file is available for chat
- `Failed` — operation failed; check `errorMessage` for details

### List recent operations

List operations across all files on an assistant, optionally filtered by type or status. Operations are retained for 30 days.

```typescript
const ops = await assistant.listOperations({
  status: 'Completed',
  limit: 10,
});

for (const op of ops.operations ?? []) {
  console.log(op.operationType, op.fileId, op.status);
}
```

## List files

List all files that have been uploaded to an Assistant. Optionally, filter by metadata:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

// List all files
const allFiles = await assistant.listFiles();
console.log(allFiles);
// {
//   files: [
//     {
//       name: 'product-catalog.txt',
//       id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
//       metadata: { source: 'catalog', version: '2025-01' },
//       createdOn: '2025-01-06T19:14:21.969Z',
//       updatedOn: '2025-01-06T19:14:36.925Z',
//       status: 'Available',
//       percentDone: 1
//     },
//     // ... more files
//   ]
// }

// List files with metadata filter
const filteredFiles = await assistant.listFiles({
  filter: { source: 'catalog' },
});
```

## Describe a file

Get the status and metadata of a specific file:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const fileInfo = await assistant.describeFile({
  fileId: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
});

console.log(fileInfo);
// {
//   name: 'product-catalog.txt',
//   id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
//   metadata: { source: 'catalog', version: '2025-01' },
//   createdOn: '2025-01-06T19:14:21.969Z',
//   updatedOn: '2025-01-06T19:14:36.925Z',
//   status: 'Available',
//   percentDone: 1,
// }
```

## Delete a file

Delete a file from an Assistant by ID. Deletion is asynchronous — the returned `OperationModel` tracks the operation.

> **Warning:** Deleting files is a PERMANENT operation. Deleted files cannot be recovered.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const operation = await assistant.deleteFile('1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b');
console.log(operation.status); // 'Processing'
```

## Complete file management workflow

Here's a complete example showing file upload, status checking via `describeOperation`, and cleanup:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function fileManagementWorkflow() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const assistant = pc.assistant({ name: 'my-assistant' });

  // 1. Upload files and collect operation IDs
  const op1 = await assistant.uploadFile({
    path: 'catalog-2024.txt',
    metadata: { year: '2024', type: 'catalog' },
  });

  const op2 = await assistant.uploadFile({
    path: 'catalog-2025.txt',
    metadata: { year: '2025', type: 'catalog' },
  });

  // 2. Poll until both uploads complete
  for (const op of [op1, op2]) {
    let current = op;
    while (current.status === 'Processing') {
      await new Promise((r) => setTimeout(r, 2000));
      current = await assistant.describeOperation({ operationId: op.id });
    }
    if (current.status === 'Failed') {
      throw new Error(`Upload failed: ${current.errorMessage}`);
    }
  }

  console.log('All files are ready!');

  // 3. List files by metadata
  const catalogFiles = await assistant.listFiles({
    filter: { type: { $eq: 'catalog' } },
  });

  console.log(`Found ${catalogFiles.files?.length} catalog files`);

  // 4. Chat with the assistant
  const response = await assistant.chat({
    messages: [
      {
        role: 'user',
        content: 'What are the differences between the 2024 and 2025 catalogs?',
      },
    ],
  });

  console.log(response.message?.content);

  // 5. Clean up old files
  const oldFiles = await assistant.listFiles({
    filter: { year: { $eq: '2024' } },
  });

  for (const file of oldFiles.files ?? []) {
    await assistant.deleteFile(file.id);
    console.log(`Deleting: ${file.name}`);
  }
}

fileManagementWorkflow();
```

## Supported file types

The SDK explicitly supports the following file types with proper MIME type handling:

- `.pdf` - PDF documents
- `.txt` - Plain text files
- `.md` - Markdown files
- `.json` - JSON files
- `.docx` - Microsoft Word documents

Other file types can be uploaded but will be treated as generic binary files (`application/octet-stream`).

For PDF files, use the `multimodal: true` option to enable image extraction and visual content understanding.

For file size limits and additional restrictions, see [Pinecone Assistant limits](https://docs.pinecone.io/guides/assistant/pricing-and-limits#limits).

## Best practices

1. **Poll with `describeOperation`**: Don't use `listFiles` to wait for a file to become available — use `describeOperation` with the ID returned by `uploadFile`, `upsertFile`, or `deleteFile`
2. **Use `upsertFile` for stable IDs**: If you need to replace a file at a predictable ID (e.g. a spec or config file), use `upsertFile` instead of deleting and re-uploading
3. **Descriptive metadata**: Add meaningful metadata to files for easy filtering and organization
4. **Handle errors**: Check `op.errorMessage` when an operation's status is `Failed`
5. **Clean up**: Delete obsolete files to manage storage

For more information on getting started with Assistants, see [Getting Started](./getting-started.md).
