import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;
let fileId: string;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);
  const files = await assistant.listFiles({
    filter: { key: 'valueOne' },
  });
  if (files.files && files.files.length > 0) {
    fileId = files.files[0].id;
  } else {
    throw new Error('No files found with metadata key: valueOne');
  }
});

describe('Describe file happy path', () => {
  test('Describe file', async () => {
    const response = await assistant.describeFile(fileId);
    expect(response).toBeDefined();
    expect(response.status).toBeDefined();
    expect(response.id).toBeDefined();
    if (response.metadata) {
      expect(response.metadata['key']).toBeDefined();
      expect(response.metadata['key']).toEqual('valueOne');
      expect(response.metadata['keyTwo']).toBeDefined();
      expect(response.metadata['keyTwo']).toEqual('valueTwo');
    }
  });
});

describe('Describe file error paths', () => {
  test('Describe with nonexistent fileId', async () => {
    await expect(assistant.describeFile('nonexistent-file-id')).rejects.toThrow(
      /404/
    );
  });

  test('Describe with empty fileId', async () => {
    await expect(assistant.describeFile('')).rejects.toThrow();
  });

  test('Describe file with nonexistent assistant', async () => {
    await expect(
      pinecone.Assistant('nonexistent').describeFile(fileId)
    ).rejects.toThrow(/404/);
  });
});
