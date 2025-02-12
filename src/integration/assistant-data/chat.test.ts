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
  test.skip('Chat with messages', async () => {
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
  const chatMethods = [
    'chat',
    'chatStream',
    'chatCompletion',
    'chatCompletionStream',
  ];
  test.each(chatMethods)('%s with empty messages', async (method) => {
    const throwError = async () => {
      await assistant[method]({ messages: [] });
    };
    await expect(throwError()).rejects.toThrow('Must have at least 1 message');
  });

  test.each(chatMethods)('%s with invalid role type', async (method) => {
    const throwError = async () => {
      await assistant[method]({
        messages: [{ role: 'invalid', content: 'Hello' }],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'No role specified in message object. Must be one of "user" or "assistant"'
    );
  });

  test.each(chatMethods)('%s with no role key', async (method) => {
    const throwError = async () => {
      await assistant[method]({
        messages: [{}],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'Message object must have exactly two keys: "role" and "content"'
    );
  });

  test.each(chatMethods)('%s with invalid model', async (method) => {
    const throwError = async () => {
      await assistant[method]({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'invalid',
      });
    };
    await expect(throwError()).rejects.toThrow(
      'Invalid model: "invalid". Must be one of: "gpt-4o", "claude-3-5-sonnet"'
    );
  });

  test.each(chatMethods)('%s with nonexistent assistant', async (method) => {
    const throwError = async () => {
      await pinecone.Assistant('nonexistent')[method]({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    };
    await expect(throwError()).rejects.toThrow(
      'A call to https://api.pinecone.io/assistant/assistants/nonexistent returned HTTP status 404.'
    );
  });
});
