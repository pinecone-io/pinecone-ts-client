# File Management

This guide covers operations for managing files within a Pinecone Assistant, including uploading, listing, describing, and deleting files.

For more information, see [Manage files](https://docs.pinecone.io/guides/assistant/manage-files).

## Upload a file

Upload a local file to an Assistant. You can attach metadata to the file for organization and filtering purposes.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const uploadResponse = await assistant.uploadFile({
  path: 'product-catalog.txt',
  metadata: {
    source: 'catalog',
    version: '2025-01',
    category: 'products',
  },
});

console.log(uploadResponse);
// {
//   name: 'product-catalog.txt',
//   id: '921ad74c-2421-413a-8c86-fca81ceabc5c',
//   metadata: { source: 'catalog', version: '2025-01', category: 'products' },
//   createdOn: '2025-01-06T19:14:21.969Z',
//   updatedOn: '2025-01-06T19:14:21.969Z',
//   status: 'Processing',
//   percentDone: null,
//   signedUrl: null,
//   errorMessage: null
// }
```

## Upload files with multimodal processing

For PDF files containing images, charts, or diagrams, enable multimodal processing to extract and index visual content:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

const uploadResponse = await assistant.uploadFile({
  path: 'quarterly-report-with-charts.pdf',
  multimodal: true, // Enable image extraction and processing
  metadata: {
    document_type: 'financial_report',
    quarter: 'Q4',
    year: 2024,
  },
});

// The assistant can now understand and reference charts, graphs, and images
// in the document when answering questions
```

When `multimodal: true`, the assistant will:

- Extract images, charts, and diagrams from the PDF
- Generate captions for visual content
- Enable the assistant to answer questions about visual elements
- Allow you to retrieve image-related context snippets

## File processing states

After uploading, files go through several states:

- `Processing` - File is being processed
- `Available` - File is ready to be used in chats
- `Failed` - File processing failed

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
//   signedUrl: undefined,
//   errorMessage: undefined
// }
```

## Delete a file

Delete a file from an Assistant by ID:

> **Warning:** Deleting files is a PERMANENT operation. Deleted files cannot be recovered.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const assistant = pc.assistant({ name: 'my-assistant' });

await assistant.deleteFile({
  fileId: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
});
```

## Complete file management workflow

Here's a complete example showing file upload, status checking, and cleanup:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function fileManagementWorkflow() {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const assistant = pc.assistant({ name: 'my-assistant' });

  // 1. Upload multiple files
  const file1 = await assistant.uploadFile({
    path: 'catalog-2024.txt',
    metadata: { year: '2024', type: 'catalog' },
  });

  const file2 = await assistant.uploadFile({
    path: 'catalog-2025.txt',
    metadata: { year: '2025', type: 'catalog' },
  });

  // 2. Wait for files to be processed
  let allReady = false;
  while (!allReady) {
    const files = await assistant.listFiles();
    allReady = files.files.every((f) => f.status === 'Available');

    if (!allReady) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }

  console.log('All files are ready!');

  // 3. List files by metadata
  const catalogFiles = await assistant.listFiles({
    filter: { type: { $eq: 'catalog' } },
  });

  console.log(`Found ${catalogFiles.files.length} catalog files`);

  // 4. Chat with the assistant
  const response = await assistant.chat({
    messages: [
      {
        role: 'user',
        content: 'What are the differences between the 2024 and 2025 catalogs?',
      },
    ],
  });

  console.log(response.message.content);

  // 5. Clean up old files
  const oldFiles = await assistant.listFiles({
    filter: { year: { $eq: '2024' } },
  });

  for (const file of oldFiles.files) {
    await assistant.deleteFile({ fileId: file.id });
    console.log(`Deleted old file: ${file.name}`);
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

1. **Descriptive metadata**: Add meaningful metadata to files for easy filtering and organization
2. **Check status**: Always verify files are `Available` before chatting
3. **Handle errors**: Check for `errorMessage` when file status is `Failed`
4. **Clean up**: Delete obsolete files to manage storage
5. **Organize by source**: Use metadata to track file sources and versions

For more information on getting started with Assistants, see [Getting Started](./getting-started.md).
