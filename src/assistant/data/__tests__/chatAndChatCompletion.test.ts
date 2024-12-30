import {
  messagesValidation,
  modelValidation,
  ChatRequest,
  chatClosed,
} from '../chat';
import { chatCompletionClosed, ChatCompletionRequest } from '../chatCompletion';
import {
  ChatModelEnum,
  ManageAssistantsApi,
} from '../../../pinecone-generated-ts-fetch/assistant_data';

const endpoints = ['chat', 'chatCompletion'];

endpoints.forEach((endpoint) => {
  describe(`${endpoint} validation`, () => {
    describe('messagesValidation', () => {
      test('converts string array to MessageModel array', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: ['Hello', 'How are you?'],
        };

        const expected = [
          { role: 'user', content: 'Hello' },
          { role: 'user', content: 'How are you?' },
        ];

        expect(messagesValidation(input)).toEqual(expected);
      });

      test('validates message objects with role and content', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        };

        expect(messagesValidation(input)).toEqual(input.messages);
      });

      test('throws error when role is missing', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: [{ content: 'Hello' }],
        };

        expect(() => messagesValidation(input)).toThrow('No role specified');
      });

      test('throws error when object has invalid keys', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: [{ role: 'user', content: 'Hello', extra: 'field' }],
        };

        expect(() => messagesValidation(input)).toThrow('exactly two keys');
      });
    });

    describe('modelValidation', () => {
      test('returns default GPT-4 model when no model specified', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: ['Hello'],
        };

        expect(modelValidation(input)).toBe(ChatModelEnum.Gpt4o);
      });

      test('validates correct model string', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: ['Hello'],
          model: 'gpt-4o',
        };

        expect(modelValidation(input)).toBe(ChatModelEnum.Gpt4o);
      });

      test('throws error for invalid model', () => {
        const input: ChatRequest | ChatCompletionRequest = {
          messages: ['Hello'],
          model: 'invalid-model',
        };

        expect(() => modelValidation(input)).toThrow('Invalid model specified');
      });

      test('throws error when no messages provided', async () => {
        const mockApi = {
          chatAssistant: jest.fn(),
        } as unknown as ManageAssistantsApi;

        const chat = chatClosed('test-assistant', mockApi);
        const chatCompletion = chatCompletionClosed('test-assistant', mockApi);

        const input = {} as ChatRequest;
        const inputCompletion = {} as ChatCompletionRequest;

        await expect(chat(input)).rejects.toThrow('No messages passed');
        await expect(chatCompletion(inputCompletion)).rejects.toThrow(
          'No messages passed'
        );
      });
    });
  });
});
