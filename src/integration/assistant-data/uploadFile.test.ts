import { Pinecone } from '../../pinecone';
import { AssistantDataPlane } from '../../assistant/data';
import * as fs from 'fs';
import * as path from 'path';
import { sleep } from '../test-helpers';

let pinecone: Pinecone;
let assistant: AssistantDataPlane;
let assistantName: string;
let tempFileName: string;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);

  // Create a temporary test file
  tempFileName = `test-upload-${Date.now()}.txt`;
  fs.writeFileSync(tempFileName, 'This is test content for file upload');

  // Add a small delay to ensure file system sync
  await sleep(1000);
});

afterAll(() => {
  // Cleanup: remove temporary test file
  if (fs.existsSync(tempFileName)) {
    fs.unlinkSync(tempFileName);
  }
});

describe('Upload file happy path', () => {
  test('Upload file without metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFileName
    });
    expect(response).toBeDefined();
    expect(response.status).toEqual(200);
  });

  test('Upload file with metadata', async () => {
    const response = await assistant.uploadFile({
      path: tempFileName,
      metadata: {
        description: 'Test file',
        category: 'integration-test'
      }
    });
    expect(response).toBeDefined();
    expect(response.status).toEqual(200);
  });
});

describe('Upload file error paths', () => {
  test('Upload with nonexistent file path', async () => {
    const throwError = async () => {
      await assistant.uploadFile({
        path: 'nonexistent-file.txt'
      });
    };
    await expect(throwError()).rejects.toThrow();
  });

  test('Upload to nonexistent assistant', async () => {
    const throwError = async () => {
      await pinecone.Assistant('nonexistent').uploadFile({
        path: tempFileName
      });
    };
    await expect(throwError()).rejects.toThrow(/404/);
  });

  test('Upload with empty file path', async () => {
    const throwError = async () => {
      await assistant.uploadFile({
        path: ''
      });
    };
    await expect(throwError()).rejects.toThrow('File path is required');
  });
});