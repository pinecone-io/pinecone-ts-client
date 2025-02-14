import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';

let pinecone: Pinecone;
let assistant: Assistant;
let assistantName: string;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);
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
    const throwError = async () => {
      await assistant.context({ query: '' });
    };
    await expect(throwError()).rejects.toThrow(
      'You must pass an object with required properties (`query`) to retrieve context snippets.'
    );
  });

  test('Context with nonexistent assistant', async () => {
    const throwError = async () => {
      await pinecone.Assistant('nonexistent').context({
        query: 'What is in the file?',
      });
    };
    await expect(throwError()).rejects.toThrow(/404/);
  });
});
