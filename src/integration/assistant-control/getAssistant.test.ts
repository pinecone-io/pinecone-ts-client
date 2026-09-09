import { Pinecone } from '../../pinecone';
import {
  cleanupResources,
  randomString,
  waitUntilAssistantReady,
} from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;
let assistantName: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  assistantName = randomString(5);
  await pinecone.assistants.create({ name: assistantName });

  // Wait for assistant to be ready instead of fixed sleep
  await waitUntilAssistantReady(assistantName);
});

afterAll(async () => {
  await cleanupResources(pinecone, [], assistantName ? [assistantName] : []);
}, 60_000);

describe('describeAssistant happy path', () => {
  test('simple get', async () => {
    const assistantInfo = await pinecone.assistants.describe(assistantName);
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
      pinecone.assistants.describe('non-existent-assistant'),
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
