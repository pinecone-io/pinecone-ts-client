import { Pinecone } from '../../pinecone';
import {
  cleanupResources,
  randomString,
  waitUntilAssistantReady,
} from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

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

describe('deleteAssistant happy path', () => {
  test('simple delete', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);

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
