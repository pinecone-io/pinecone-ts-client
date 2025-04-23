import { Pinecone } from '../../pinecone';
import { randomString, sleep } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;
let assistantName: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  assistantName = randomString(5);
  await pinecone.createAssistant({ name: assistantName });
  await sleep(2000);
});

afterAll(async () => {
  await pinecone.deleteAssistant(assistantName);
});

describe('describeAssistant happy path', () => {
  test('simple get', async () => {
    const assistantInfo = await pinecone.describeAssistant(assistantName);
    expect(assistantInfo.name).toEqual(assistantName);
    expect(assistantInfo.instructions).toBeUndefined();
    expect(assistantInfo.metadata).toBeUndefined();
    expect(assistantInfo.status).toBeDefined();
    expect(assistantInfo.host).toBeDefined();
    expect(assistantInfo.createdAt).toBeDefined();
    expect(assistantInfo.updatedAt).toBeDefined();
  });
});

describe('describeAssistant error paths', () => {
  test('get non-existent assistant', async () => {
    await expect(
      pinecone.describeAssistant('non-existent-assistant')
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
