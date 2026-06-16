import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { waitUntilAssistantFileReady } from '../test-helpers';
import { getTestContext } from '../test-context';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;
let tempFilePath: string;
let tempFile: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  assistantName = fixtures.assistant.name;
  assistant = pinecone.Assistant({ name: assistantName });

  tempFile = `test-operations-${Date.now()}.txt`;
  tempFilePath = path.join(os.tmpdir(), tempFile);
  fs.writeFileSync(tempFilePath, 'This is test content for operations');

  if (!fs.existsSync(tempFilePath)) {
    throw new Error(`Temporary file was not created: ${tempFilePath}`);
  }
});

afterAll(() => {
  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
});

describe('describeOperation', () => {
  test('describes the operation returned by uploadFile', async () => {
    const uploadOp = await assistant.uploadFile({ path: tempFilePath });
    expect(uploadOp.id).toBeDefined();

    const described = await assistant.describeOperation(uploadOp.id);
    expect(described.id).toBe(uploadOp.id);
    expect(described.status).toBeDefined();
    expect(described.operationType).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, uploadOp.fileId!);
    await assistant.deleteFile(uploadOp.fileId!);
  });

  test('throws for a nonexistent operation id', async () => {
    await expect(
      assistant.describeOperation('nonexistent-operation-id'),
    ).rejects.toThrow(/404/);
  });

  test('throws when operationId is empty', async () => {
    await expect(assistant.describeOperation('')).rejects.toThrow(
      'You must pass the operationId of an operation to describe.',
    );
  });
});

describe('listOperations', () => {
  test('lists operations for the assistant', async () => {
    const uploadOp = await assistant.uploadFile({ path: tempFilePath });
    expect(uploadOp.id).toBeDefined();

    const { operations } = await assistant.listOperations();
    expect(operations).toBeDefined();
    expect(Array.isArray(operations)).toBe(true);
    expect(operations!.some((op) => op.id === uploadOp.id)).toBe(true);

    await waitUntilAssistantFileReady(assistantName, uploadOp.fileId!);
    await assistant.deleteFile(uploadOp.fileId!);
  });
});

describe('upsertFile', () => {
  test('replaces the content of an existing file by id', async () => {
    const uploadOp = await assistant.uploadFile({ path: tempFilePath });
    expect(uploadOp.fileId).toBeDefined();
    await waitUntilAssistantFileReady(assistantName, uploadOp.fileId!);

    const upsertOp = await assistant.upsertFile({
      assistantFileId: uploadOp.fileId!,
      path: tempFilePath,
    });
    expect(upsertOp).toBeDefined();
    expect(upsertOp.id).toBeDefined();
    expect(upsertOp.status).toBeDefined();

    await waitUntilAssistantFileReady(assistantName, uploadOp.fileId!);
    await assistant.deleteFile(uploadOp.fileId!);
  });

  test('throws when assistantFileId is missing', async () => {
    await expect(
      assistant.upsertFile({ path: tempFilePath } as never),
    ).rejects.toThrow(
      'You must pass the `assistantFileId` of the file to upsert.',
    );
  });
});
