import { Pinecone } from '../../pinecone';
import {
  cleanupResources,
  randomString,
  waitUntilAssistantReady,
} from '../test-helpers';

let pinecone: Pinecone;
const assistantNames: string[] = [];
const cleanupTrackedResources = async () => {
  await cleanupResources(pinecone, [], assistantNames);
  // Retain names after failure so a later hook can retry the deletion.
  assistantNames.length = 0;
};
afterEach(cleanupTrackedResources, 60_000);
afterAll(cleanupTrackedResources, 60_000);

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('createAssistant happy path', () => {
  test('simple create', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await pinecone.assistants.create({
      name: assistantName,
      instructions: 'test-instructions',
      metadata: { key: 'value', keyTwo: 'valueTwo' },
      region: 'us',
    });

    // Wait for assistant to be ready instead of fixed sleep
    await waitUntilAssistantReady(assistantName);

    const description = await pinecone.assistants.describe(assistantName);
    expect(description.name).toEqual(assistantName);
    expect(description.instructions).toEqual('test-instructions');
    expect(description.metadata).toEqual({ key: 'value', keyTwo: 'valueTwo' });
  });
});

describe('createAssistant error paths', () => {
  test('createAssistant with too much metadata', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await expect(
      pinecone.assistants.create({
        name: assistantName,
        metadata: { key: 'a'.repeat(1000000) },
      }),
    ).rejects.toThrow(/Metadata exceeds maximum length of 16384 bytes/);
  });

  test('createAssistant with invalid region', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await expect(
      pinecone.assistants.create({
        name: assistantName,
        region: 'invalid-region',
      }),
    ).rejects.toThrow('Invalid region specified. Must be one of "us" or "eu"');
  });

  test('createAssistant with empty assistant name', async () => {
    const assistantName = '';
    await expect(
      pinecone.assistants.create({
        name: assistantName,
      }),
    ).rejects.toThrow('Invalid assistant name');
  });

  test('createAssistant with duplicate name', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await pinecone.assistants.create({
      name: assistantName,
    });
    await expect(
      pinecone.assistants.create({
        name: assistantName,
      }),
    ).rejects.toThrow();
  });
});
