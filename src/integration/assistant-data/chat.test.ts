import { Pinecone } from '../../pinecone';
import { Assistant } from '../../assistant';
import { PineconeBadRequestError } from '../../errors';
import {
  ChatCompletionModel,
  ChatModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { ChatStream } from '../../utils/';
import type {
  StreamedChatCompletionResponse,
  StreamedChatResponse,
} from '../../assistant/data/types';
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

describe('non-streaming chat success paths', () => {
  test('chat', async () => {
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
          errorResponse.message,
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

  test('chatCompletion', async () => {
    let response: ChatCompletionModel;

    try {
      response = await assistant.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    } catch (error) {
      const errorResponse = error as PineconeBadRequestError;
      if (errorResponse.name == 'PineconeBadRequestError') {
        console.log(
          'Assistant not ready to chat yet, trying again ',
          errorResponse.message,
        );
        response = await assistant.chatCompletion({
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } else {
        throw error;
      }
    }
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.model).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.choices).toBeDefined();
  });
});

describe('streaming chat success paths', () => {
  test('chatStream', async () => {
    let response: ChatStream<StreamedChatResponse>;

    try {
      response = await assistant.chatStream({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    } catch (error) {
      const errorResponse = error as PineconeBadRequestError;
      if (errorResponse.name == 'PineconeBadRequestError') {
        console.log(
          'Assistant not ready to chat yet, trying again ',
          errorResponse.message,
        );
        response = await assistant.chatStream({
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } else {
        throw error;
      }
    }

    // stream response and validate
    expect(response).toBeDefined();
    for await (const chatMessage of response) {
      expect(chatMessage).toBeDefined();
      expect(chatMessage.id).toBeDefined();
      expect(chatMessage.model).toBeDefined();
      expect(chatMessage.type).toBeDefined();

      if (chatMessage.type === 'message_start') {
        expect(chatMessage.role).toBeDefined();
      } else if (chatMessage.type === 'content_chunk') {
        expect(chatMessage.delta).toBeDefined();
      } else if (chatMessage.type === 'citation') {
        expect(chatMessage.citation).toBeDefined();
      } else if (chatMessage.type === 'message_end') {
        expect(chatMessage.finishReason).toBeDefined();
        expect(chatMessage.usage).toBeDefined();
      }
    }
  });

  test('chatCompletionStream', async () => {
    let response: ChatStream<StreamedChatCompletionResponse>;

    try {
      response = await assistant.chatCompletionStream({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    } catch (error) {
      const errorResponse = error as PineconeBadRequestError;
      if (errorResponse.name == 'PineconeBadRequestError') {
        console.log(
          'Assistant not ready to chat yet, trying again ',
          errorResponse.message,
        );
        response = await assistant.chatCompletionStream({
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } else {
        throw error;
      }
    }

    // stream response and validate
    expect(response).toBeDefined();
    for await (const chatMessage of response) {
      expect(chatMessage).toBeDefined();
      expect(chatMessage.id).toBeDefined();
      expect(chatMessage.model).toBeDefined();
      expect(chatMessage.choices).toBeDefined();
    }
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
    await expect(assistant[method]({ messages: [] })).rejects.toThrow(
      'Must have at least 1 message',
    );
  });

  test.each(chatMethods)('%s with invalid role type', async (method) => {
    await expect(
      assistant[method]({
        messages: [{ role: 'invalid', content: 'Hello' }],
      }),
    ).rejects.toThrow(
      'No role specified in message object. Must be one of "user" or "assistant"',
    );
  });

  test.each(chatMethods)('%s with no role key', async (method) => {
    await expect(
      assistant[method]({
        messages: [{}],
      }),
    ).rejects.toThrow(
      'Message object must have exactly two keys: "role" and "content"',
    );
  });

  test.each(chatMethods)('%s with invalid model', async (method) => {
    await expect(
      assistant[method]({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'invalid',
      }),
    ).rejects.toThrow(/Invalid model.*invalid/i);
  });

  test.each(chatMethods)('%s with nonexistent assistant', async (method) => {
    await expect(
      pinecone.Assistant({ name: 'nonexistent' })[method]({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    ).rejects.toThrow(
      'A call to https://api.pinecone.io/assistant/assistants/nonexistent returned HTTP status 404.',
    );
  });
});
