import { Pinecone } from '../../pinecone';
import { randomString, sleep } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('deleteAssistant happy path', () => {
  test('simple delete', async () => {
    const assistantName = randomString(5);

    await pinecone.createAssistant({
      name: assistantName,
    });

    await pinecone.deleteAssistant(assistantName);
    await sleep(3000);

    await expect(pinecone.describeAssistant(assistantName)).rejects.toThrow(
      PineconeNotFoundError
    );
  });
});

describe('deleteAssistant error paths', () => {
  test('delete non-existent assistant', async () => {
    await expect(
      pinecone.deleteAssistant('non-existent-assistant')
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
