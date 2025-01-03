import { Pinecone } from '../../pinecone';
import { randomString } from '../test-helpers';

let pinecone: Pinecone;
let assistantNameOne: string;
let assistantNameTwo: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  assistantNameOne = randomString(5);
  assistantNameTwo = randomString(5);
  await pinecone.assistant.createAssistant({ name: assistantNameOne });
  await pinecone.assistant.createAssistant({ name: assistantNameTwo });
});

afterAll(async () => {
  await pinecone.assistant.deleteAssistant(assistantNameOne);
  await pinecone.assistant.deleteAssistant(assistantNameTwo);
});

describe('listAssistant happy path', () => {
  // Note: this test will change if you centralize the assistant creation and deletion for data plane integration tests
  test('list existing Assistants', async () => {
    const assistants = await pinecone.assistant.listAssistants();
    expect(assistants.assistants).toHaveLength(2); // This is where this test will change
    if (assistants.assistants) {
      const assistantNames = assistants.assistants.map(
        (assistant) => assistant.name
      );
      expect(assistantNames).toContain(assistantNameOne);
      expect(assistantNames).toContain(assistantNameTwo);
    }
  });
});
