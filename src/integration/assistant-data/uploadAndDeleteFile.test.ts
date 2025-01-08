import { Pinecone } from '../../pinecone';
import { AssistantDataPlane } from '../../assistant/data';
import * as fs from 'fs';
import { sleep } from '../test-helpers';

let pinecone: Pinecone;
let assistant: AssistantDataPlane;
let assistantName: string;
let tempFile: string;
let tempFileWithMetadata: string;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);

  // Create two temporary test files
  const content = 'This is test content for file upload';
  // 1: file without metadata
  tempFile = `test-upload-${Date.now()}.txt`;
  fs.writeFileSync(tempFile, content);

  // 2: file with metadata
  tempFileWithMetadata = `test-upload-metadata-${Date.now()}.txt`;
  fs.writeFileSync(tempFileWithMetadata, content);

  // Add a small delay to ensure file system sync
  await sleep(1000);
});

afterAll(() => {
  // Cleanup: remove temporary test files
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  if (fs.existsSync(tempFileWithMetadata)) {
    fs.unlinkSync(tempFileWithMetadata);
  }
});

describe('Upload file happy path', () => {
  test('Upload file without metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFile,
    });
    await sleep(25000); // Crazy long sleep necessary; need to optimize (+ technically we already know this works
    // b/c of setup.ts
    expect(response).toBeDefined();
    expect(response.name).toEqual(tempFile);
    expect(response.id).toBeDefined();
    expect(response.createdOn).toBeDefined(); // Sometimes these dates populate as "Invalid" at first, but then get updated
    expect(response.updatedOn).toBeDefined();
    expect(response.status).toBeDefined();

    // Delete file happy path test:
    expect(await assistant.deleteFile({ fileId: response.id })).toBeUndefined();
  });

  test('Upload file with metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFileWithMetadata,
      metadata: {
        description: 'Test file',
        category: 'integration-test',
      },
    });
    await sleep(25000); // Crazy long sleep necessary; need to optimize
    expect(response).toBeDefined();
    expect(response.name).toEqual(tempFileWithMetadata);
    expect(response.id).toBeDefined();
    expect(response.createdOn).toBeDefined();
    expect(response.updatedOn).toBeDefined();
    expect(response.status).toBeDefined();
    expect(response.metadata).toBeDefined();
    if (response.metadata) {
      expect(response.metadata['description']).toEqual('Test file');
      expect(response.metadata['category']).toEqual('integration-test');
    }

    // Delete file happy path test:
    expect(await assistant.deleteFile({ fileId: response.id })).toBeUndefined();
  });
});

describe('Upload file error paths', () => {
  test('Upload with nonexistent file path', async () => {
    const throwError = async () => {
      await assistant.uploadFile({
        path: 'nonexistent-file.txt',
      });
    };
    await expect(throwError()).rejects.toThrow();
  });

  test('Upload to nonexistent assistant', async () => {
    const throwError = async () => {
      await pinecone.Assistant('nonexistent').uploadFile({
        path: tempFile,
      });
    };
    await expect(throwError()).rejects.toThrow(/404/);
  });

  test('Upload with empty file path', async () => {
    const throwError = async () => {
      await assistant.uploadFile({
        path: '',
      });
    };
    await expect(throwError()).rejects.toThrow('File path is required');
  });
});

describe('Delete file error paths', () => {
  test('Delete non-existent file', async () => {
    const throwError = async () => {
      await assistant.deleteFile({
        fileId: 'nonexistent-file-id',
      });
    };
    await expect(throwError()).rejects.toThrow(/404/);
  });
});
