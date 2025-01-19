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

    const noAssistant = async () => {
      await pinecone.describeAssistant(assistantName);
    };

    await expect(noAssistant()).rejects.toThrow(PineconeNotFoundError);
  });
});

describe('deleteAssistant error paths', () => {
  test('delete non-existent assistant', async () => {
    const throwError = async () => {
      await pinecone.deleteAssistant('non-existent-assistant');
    };
    await expect(throwError()).rejects.toThrow(PineconeNotFoundError);
  });
});
