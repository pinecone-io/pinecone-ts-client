import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import { getTestContext } from '../test-context';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  assistantName = fixtures.assistant.name;
  assistant = pinecone.Assistant({ name: assistantName });
});

describe('Context happy path', () => {
  test('Get context with valid query', async () => {
    const response = await assistant.context({
      query: 'What is in the uploaded file?',
    });
    expect(response).toBeDefined();
    expect(response.snippets).toBeDefined();
    expect(Array.isArray(response.snippets)).toBe(true);
  });

  test('Get context with query and filter', async () => {
    const response = await assistant.context({
      query: 'What is in the uploaded file?',
      filter: { key: 'valueOne' },
    });
    expect(response).toBeDefined();
    expect(response.snippets).toBeDefined();
    expect(Array.isArray(response.snippets)).toBe(true);
  });
});

describe('Context error paths', () => {
  test('Context with empty query', async () => {
    await expect(assistant.context({ query: '' })).rejects.toThrow(
      'You must pass an object with required properties (`query`, or `messages`) to retrieve context snippets.',
    );
  });

  test('Context with nonexistent assistant', async () => {
    await expect(
      pinecone.Assistant({ name: 'nonexistent' }).context({
        query: 'What is in the file?',
      }),
    ).rejects.toThrow(/404/);
  });
});
