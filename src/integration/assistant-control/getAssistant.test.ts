import { Pinecone } from '../../pinecone';
import { randomString, sleep } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;
let assistantName: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  assistantName = randomString(5);
  await pinecone.assistant.createAssistant({name: assistantName});
  await sleep(2000);
});

afterAll(async () => {
  await pinecone.assistant.deleteAssistant(assistantName);
});

describe('getAssistant happy path', () => {
  test('simple get', async () => {
    const assistantInfo = await pinecone.assistant.getAssistant(assistantName);
    expect(assistantInfo.name).toEqual(assistantName);
    expect(assistantInfo.instructions).toBeUndefined();
    expect(assistantInfo.metadata).toBeUndefined();
    expect(assistantInfo.status).toBeDefined();
    expect(assistantInfo.host).toBeDefined();
    expect(assistantInfo.createdAt).toBeDefined();
    expect(assistantInfo.updatedAt).toBeDefined();
  });
});

describe('getAssistant error paths', () => {
  test('get non-existent assistant', async () => {
    const throwError = async () => {
      await pinecone.assistant.getAssistant('non-existent-assistant');
    };
    await expect(throwError()).rejects.toThrow(PineconeNotFoundError);
  });
});