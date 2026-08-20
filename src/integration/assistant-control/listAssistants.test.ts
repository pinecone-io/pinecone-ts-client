import { Pinecone } from '../../pinecone';
import { randomString } from '../test-helpers';

let pinecone: Pinecone;
let assistantNameOne: string;
let assistantNameTwo: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  assistantNameOne = randomString(5);
  assistantNameTwo = randomString(5);
  await pinecone.assistants.create({ name: assistantNameOne });
  await pinecone.assistants.create({ name: assistantNameTwo });
});

afterAll(async () => {
  await pinecone.assistants.delete(assistantNameOne);
  await pinecone.assistants.delete(assistantNameTwo);
});

describe('listAssistant happy path', () => {
  test('list existing Assistants', async () => {
    const assistants = await pinecone.assistants.list();
    expect(assistants.assistants).toBeDefined();
    if (assistants.assistants) {
      const assistantNames = assistants.assistants.map(
        (assistant) => assistant.name,
      );
      expect(assistantNames).toContain(assistantNameOne);
      expect(assistantNames).toContain(assistantNameTwo);
    }
  });
});
