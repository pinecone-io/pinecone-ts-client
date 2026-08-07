import { Pinecone } from '../../pinecone';
import { randomString, waitUntilAssistantReady } from '../test-helpers';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('createAssistant happy path', () => {
  test('simple create', async () => {
    const assistantName = randomString(5);
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

    await pinecone.assistants.delete(assistantName);
  });
});

describe('createAssistant error paths', () => {
  test('createAssistant with too much metadata', async () => {
    const assistantName = randomString(5);
    await expect(
      pinecone.assistants.create({
        name: assistantName,
        metadata: { key: 'a'.repeat(1000000) },
      }),
    ).rejects.toThrow(/Metadata exceeds maximum length of 16384 bytes/);
  });

  test('createAssistant with invalid region', async () => {
    const assistantName = randomString(5);
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
    await pinecone.assistants.create({
      name: assistantName,
    });
    await expect(
      pinecone.assistants.create({
        name: assistantName,
      }),
    ).rejects.toThrow();

    await pinecone.assistants.delete(assistantName);
  });
});
