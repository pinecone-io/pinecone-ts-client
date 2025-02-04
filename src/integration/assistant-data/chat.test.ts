import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import { PineconeBadRequestError } from '../../errors';
import { ChatModel } from '../../pinecone-generated-ts-fetch/assistant_data';

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

describe('Chat happy path', () => {
  test('Chat with messages', async () => {
    let response: ChatModel;
    try {
      response = await assistant.chat({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    } catch (error) {
      const errorResponse = error as PineconeBadRequestError;
      if (errorResponse.name == 'PineconeBadRequestError') {
        console.log(
          'Assistant not ready to chat yet, trying again ',
          errorResponse.message
        );
        response = await assistant.chat({
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } else {
        throw error;
      }
    }
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.model).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.finishReason).toBeDefined();
  });
});

describe('Chat error paths', () => {
  test('Chat with empty messages', async () => {
    const throwError = async () => {
      await assistant.chat({ messages: [] });
    };
    await expect(throwError()).rejects.toThrow('Must have at least 1 message');
  });

  test('Chat with invalid role type', async () => {
    const throwError = async () => {
      await assistant.chat({
        messages: [{ role: 'invalid', content: 'Hello' }],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'No role specified in message object. Must be one of "user" or "assistant"'
    );
  });

  test('Chat with no role key', async () => {
    const throwError = async () => {
      await assistant.chat({
        messages: [{}],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'Message object must have exactly two keys: "role" and "content"'
    );
  });

  test('Chat with invalid model', async () => {
    const throwError = async () => {
      await assistant.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'invalid',
      });
    };
    await expect(throwError()).rejects.toThrow(
      'Invalid model specified. Must be one of "gpt-4o" or "claude-3-5-sonnet"'
    );
  });

  test('Chat with nonexistent assistant', async () => {
    const throwError = async () => {
      await pinecone.Assistant('nonexistent').chat({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'A call to https://api.pinecone.io/assistant/assistants/nonexistent returned HTTP status 404.'
    );
  });
});
