import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { sleep } from '../test-helpers';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;
let tempFile: string;
let tempFilePath: string;
let tempFileWithMetadata: string;
let tempFileWithMetadataPath: string;

beforeAll(async () => {
  if (!process.env.ASSISTANT_NAME) {
    throw new Error('ASSISTANT_NAME environment variable is not set');
  } else {
    assistantName = process.env.ASSISTANT_NAME;
  }

  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);

  // Create two temporary test files
  const content = 'This is test content for file upload';
  // 1: file without metadata
  tempFile = `test-upload-${Date.now()}.txt`;
  tempFilePath = path.join(os.tmpdir(), tempFile);
  try {
    fs.writeFileSync(tempFilePath, content);
    console.log('File written:', tempFilePath);
  } catch (err) {
    console.error('Error writing file:', err);
  }

  // 2: file with metadata
  tempFileWithMetadata = `test-upload-metadata-${Date.now()}.txt`;
  tempFileWithMetadataPath = path.join(os.tmpdir(), tempFileWithMetadata);

  try {
    fs.writeFileSync(tempFileWithMetadataPath, content);
    console.log('File written:', tempFileWithMetadataPath);
  } catch (err) {
    console.error('Error writing file:', err);
  }

  // Add a small delay to ensure file system sync
  await sleep(5000);

  if (!fs.existsSync(tempFilePath)) {
    throw new Error(`Temporary file was not created: ${tempFilePath}`);
  }
  if (!fs.existsSync(tempFileWithMetadataPath)) {
    throw new Error(
      `Temporary file was not created: ${tempFileWithMetadataPath}`
    );
  }
});

afterAll(() => {
  // Cleanup: remove temporary test files
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  if (fs.existsSync(tempFileWithMetadataPath)) {
    fs.unlinkSync(tempFileWithMetadataPath);
  }
});

describe('Upload file happy path', () => {
  test('Upload file without metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFilePath,
    });

    expect(response).toBeDefined();
    expect(response.name).toEqual(tempFile);
    expect(response.id).toBeDefined();
    expect(response.createdOn).toBeDefined();
    expect(response.updatedOn).toBeDefined();
    expect(response.status).toBeDefined();

    await sleep(30000);

    // Delete file happy path test:
    await assistant.deleteFile(response.id);
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

    await sleep(30000);

    // Delete file happy path test:
    await assistant.deleteFile(response.id);
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
        path: tempFileWithMetadataPath,
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
    await expect(throwError()).rejects.toThrow(
      'You must pass an object with required properties (`path`) to upload a file.'
    );
  });
});

describe('Delete file error paths', () => {
  test('Delete non-existent file', async () => {
    const throwError = async () => {
      await assistant.deleteFile('nonexistent-file-id');
    };
    await expect(throwError()).rejects.toThrow(/404/);
  });
});
