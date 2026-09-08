import { Pinecone } from '../../pinecone';
import { randomString, waitUntilAssistantReady } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('deleteAssistant happy path', () => {
  test('simple delete', async () => {
    const assistantName = randomString(5);

    await pinecone.assistants.create({
      name: assistantName,
    });

    // Wait for assistant to be ready before deleting
    await waitUntilAssistantReady(assistantName);

    await pinecone.assistants.delete(assistantName);
  });
});

describe('deleteAssistant error paths', () => {
  test('delete non-existent assistant', async () => {
    await expect(
      pinecone.assistants.delete('non-existent-assistant'),
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
