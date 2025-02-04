import { messagesValidation, modelValidation, chat } from '../chat';
import type { ChatOptions } from '../types';
import { chatCompletion } from '../chatCompletion';
import {
  ChatModelEnum,
  ManageAssistantsApi,
} from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';

const endpoints = ['chat', 'chatCompletion'];

endpoints.forEach((endpoint) => {
  describe(`${endpoint} validation`, () => {
    describe('messagesValidation', () => {
      test('converts string array to MessageModel array', () => {
        const input: ChatOptions = {
          messages: ['Hello', 'How are you?'],
        };

        const expected = [
          { role: 'user', content: 'Hello' },
          { role: 'user', content: 'How are you?' },
        ];

        expect(messagesValidation(input)).toEqual(expected);
      });

      test('validates message objects with role and content', () => {
        const input: ChatOptions = {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        };

        expect(messagesValidation(input)).toEqual(input.messages);
      });

      test('throws error when role is missing', () => {
        const input: ChatOptions = {
          messages: [{ content: 'Hello' }],
        };

        expect(() => messagesValidation(input)).toThrow(
          'Message object must have exactly two keys: "role" and "content"'
        );
      });

      test('throws error when object has invalid keys', () => {
        const input: ChatOptions = {
          messages: [{ role: 'user', content: 'Hello', extra: 'field' }],
        };

        expect(() => messagesValidation(input)).toThrow('exactly two keys');
      });
    });

    describe('modelValidation', () => {
      test('returns default GPT-4 model when no model specified', () => {
        const input: ChatOptions = {
          messages: ['Hello'],
        };

        expect(modelValidation(input)).toBe(ChatModelEnum.Gpt4o);
      });

      test('validates correct model string', () => {
        const input: ChatOptions = {
          messages: ['Hello'],
          model: 'gpt-4o',
        };

        expect(modelValidation(input)).toBe(ChatModelEnum.Gpt4o);
      });

      test('throws error for invalid model', () => {
        const input: ChatOptions = {
          messages: ['Hello'],
          model: 'invalid-model',
        };

        expect(() => modelValidation(input)).toThrow('Invalid model specified');
      });

      test('throws error when no messages provided', async () => {
        const AsstDataOperationsProvider = {
          provideData: async () => new ManageAssistantsApi(),
        } as AsstDataOperationsProvider;

        const chatFn = chat('test-assistant', AsstDataOperationsProvider);
        const chatCompletionFn = chatCompletion(
          'test-assistant',
          AsstDataOperationsProvider
        );

        const input = {} as ChatOptions;
        const inputCompletion = {} as ChatOptions;

        await expect(chatFn(input)).rejects.toThrow('No messages passed');
        await expect(chatCompletionFn(inputCompletion)).rejects.toThrow(
          'No messages passed'
        );
      });
    });
  });
});
