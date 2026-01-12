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
const uploadedFileIds: string[] = [];
const testRunId = Date.now();

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant({ name: assistantName });

  // Upload few more files with metadata to the assistant
  const content = 'This is test content for file upload';
  tempFile = `test-list-files-${testRunId}.txt`;
  tempFilePath = path.join(os.tmpdir(), tempFile);
  try {
    fs.writeFileSync(tempFilePath, content);
    console.log('File written:', tempFilePath);
  } catch (err) {
    console.error('Error writing file:', err);
  }
  // Add a small delay to ensure file system sync
  await sleep(5000);

  if (!fs.existsSync(tempFilePath)) {
    throw new Error(`Temporary file was not created: ${tempFilePath}`);
  }

  // Upload the file 3 times with different metadata using unique keys per test run
  for (let i = 0; i < 3; i++) {
    const file = await assistant.uploadFile({
      path: tempFilePath,
      metadata: {
        [`test_key_${testRunId}`]: `test_value_${i}`,
        [`test_int_${testRunId}`]: i,
      },
    });
    console.log('File uploaded:', file);
    uploadedFileIds.push(file.id);
  }

  // Clean up local temp file
  try {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Deleted local file: ${tempFilePath}`);
    }
  } catch (err) {
    console.error('Error deleting local file:', err);
  }
});

afterAll(async () => {
  // We can skip deleting the assistant files because they are unique to each test run
});

describe('List files', () => {
  test('List all files', async () => {
    const files = await assistant.listFiles();
    expect(files).toBeDefined();
    expect(files.files).toBeDefined();
    if (files.files) {
      // Should have at least 3 files from this test run
      expect(files.files.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('List files with metadata filter', async () => {
    const files = await assistant.listFiles({
      filter: { [`test_key_${testRunId}`]: 'test_value_0' },
    });
    expect(files).toBeDefined();
    expect(files.files).toBeDefined();
    if (files.files) {
      expect(files.files.length).toBe(1);
      expect(files.files[0].metadata).toBeDefined();
      if (files.files[0].metadata) {
        expect(files.files[0].metadata[`test_key_${testRunId}`]).toBe(
          'test_value_0'
        );
        expect(files.files[0].metadata[`test_int_${testRunId}`]).toBe(0);
      }
    }
  });

  test('List files with complex metadata filter', async () => {
    const files = await assistant.listFiles({
      filter: {
        [`test_int_${testRunId}`]: { $lt: 2 },
      },
    });
    expect(files).toBeDefined();
    expect(files.files).toBeDefined();
    if (files.files) {
      expect(files.files.length).toBe(2);
      files.files.forEach((file) => {
        expect(file.metadata).toBeDefined();
        if (file.metadata) {
          expect(file.metadata[`test_int_${testRunId}`]).toBeLessThan(2);
        }
      });
    }
  });
});
