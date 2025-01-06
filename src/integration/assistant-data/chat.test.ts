import { Pinecone } from '../../pinecone';
import { AssistantDataPlane } from '../../assistant/data';

let pinecone: Pinecone;
let assistant: AssistantDataPlane;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
}
const assistantName = process.env.ASSISTANT_NAME;
console.log('assistant name = ', assistantName);

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);
});

describe('Chat happy path', () => {
  test('Chat with messages', async () => {
    const response = await assistant.chat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response).toBeDefined();
  });
});
