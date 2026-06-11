import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  assertWithRetries,
  waitUntilAssistantFileReady,
} from '../test-helpers';
import { getTestContext } from '../test-context';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;
let tempFilePath: string;
let tempFile: string;
let tempFileWithMetadataPath: string;
let tempFileWithMetadata: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  assistantName = fixtures.assistant.name;
  assistant = pinecone.Assistant({ name: assistantName });

  const content = 'This is test content for file upload';

  // file without metadata
  tempFile = `test-upload-${Date.now()}.txt`;
  tempFilePath = path.join(os.tmpdir(), tempFile);
  try {
    fs.writeFileSync(tempFilePath, content);
    console.log('File written:', tempFilePath);
  } catch (err) {
    console.error('Error writing file:', err);
  }

  // file with metadata
  tempFileWithMetadata = `test-upload-metadata-${Date.now()}.txt`;
  tempFileWithMetadataPath = path.join(os.tmpdir(), tempFileWithMetadata);
  try {
    fs.writeFileSync(tempFileWithMetadataPath, content);
    console.log('File written:', tempFileWithMetadataPath);
  } catch (err) {
    console.error('Error writing file:', err);
  }

  if (!fs.existsSync(tempFilePath)) {
    throw new Error(`Temporary file was not created: ${tempFilePath}`);
  }
  if (!fs.existsSync(tempFileWithMetadataPath)) {
    throw new Error(
      `Temporary file was not created: ${tempFileWithMetadataPath}`,
    );
  }
});

afterAll(() => {
  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  if (fs.existsSync(tempFileWithMetadataPath))
    fs.unlinkSync(tempFileWithMetadataPath);
});

// ---------------------------------------------------------------------------
// path input (existing behaviour)
// ---------------------------------------------------------------------------

describe('Upload file happy path', () => {
  test('Upload file without metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFilePath,
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });

  test('Upload file with metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFileWithMetadataPath,
      metadata: {
        description: 'Test file',
        category: 'integration-test',
      },
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Buffer input
// ---------------------------------------------------------------------------

describe('Upload via Buffer', () => {
  test('Upload Buffer without metadata', async () => {
    const buffer = fs.readFileSync(tempFilePath);
    const fileName = `buffer-upload-${Date.now()}.txt`;

    const response = await assistant.uploadFile({
      file: buffer,
      fileName,
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });

  test('Upload Buffer with metadata', async () => {
    const buffer = fs.readFileSync(tempFilePath);
    const fileName = `buffer-upload-meta-${Date.now()}.txt`;

    const response = await assistant.uploadFile({
      file: buffer,
      fileName,
      metadata: { source: 'buffer' },
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// ReadableStream input
// ---------------------------------------------------------------------------

describe('Upload via ReadableStream', () => {
  test('Upload ReadableStream without metadata', async () => {
    const fileName = `stream-upload-${Date.now()}.txt`;

    const response = await assistant.uploadFile({
      file: fs.createReadStream(tempFilePath),
      fileName,
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });

  test('Upload ReadableStream with metadata', async () => {
    const fileName = `stream-upload-meta-${Date.now()}.txt`;

    const response = await assistant.uploadFile({
      file: fs.createReadStream(tempFilePath),
      fileName,
      metadata: { source: 'stream' },
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.fileId).toBeDefined();
    expect(response.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, response.fileId!);
    await assertWithRetries(
      () => assistant.deleteFile(response.fileId!),
      () => {
        return;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe('Upload file error paths', () => {
  test('Upload with nonexistent file path', async () => {
    await expect(
      assistant.uploadFile({
        path: 'nonexistent-file.txt',
      }),
    ).rejects.toThrow();
  });

  test('Upload to nonexistent assistant', async () => {
    await expect(
      pinecone.Assistant({ name: 'nonexistent' }).uploadFile({
        path: tempFileWithMetadataPath,
      }),
    ).rejects.toThrow(/404/);
  });

  test('Upload with empty file path', async () => {
    await expect(
      assistant.uploadFile({
        path: '',
      }),
    ).rejects.toThrow(
      'You must pass an object with required properties (`path` or `file` + `fileName`) to upload a file.',
    );
  });
});

describe('Delete file error paths', () => {
  test('Delete non-existent file', async () => {
    await expect(assistant.deleteFile('nonexistent-file-id')).rejects.toThrow(
      /404/,
    );
  });
});
