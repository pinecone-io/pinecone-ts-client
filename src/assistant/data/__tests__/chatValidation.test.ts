import {
  messagesValidation,
  modelValidation,
  validateChatOptions,
  chat,
} from '../chat';
import type { ChatOptions } from '../types';
import { chatCompletion } from '../chatCompletion';
import { ManageAssistantsApi } from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';

describe(`chat validation tests`, () => {
  describe('validateChatOptions', () => {
    test('accepts any string model', () => {
      const input: ChatOptions = {
        messages: ['Hello'],
        model: 'any-future-model',
      };

      expect(() => validateChatOptions(input)).not.toThrow();
    });

    test('throws error when model is not a string', () => {
      const input = {
        messages: ['Hello'],
        model: 123, // Invalid type
      } as unknown as ChatOptions;

      expect(() => validateChatOptions(input)).toThrow(
        'Invalid model: "123". Must be a string.',
      );
    });
  });

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
        // @ts-ignore
        messages: [{ content: 'Hello' }],
      };

      expect(() => messagesValidation(input)).toThrow(
        'Message object must have exactly two keys: "role" and "content"',
      );
    });

    test('throws error when object has invalid keys', () => {
      const input: ChatOptions = {
        // @ts-ignore
        messages: [{ role: 'user', content: 'Hello', extra: 'field' }],
      };

      expect(() => messagesValidation(input)).toThrow('exactly two keys');
    });
  });

  describe('modelValidation', () => {
    test('returns default gpt-4o model when no model specified', () => {
      const input: ChatOptions = {
        messages: ['Hello'],
      };

      expect(modelValidation(input)).toBe('gpt-4o');
    });

    test('returns the specified model string', () => {
      const input: ChatOptions = {
        messages: ['Hello'],
        model: 'gpt-4o',
      };

      expect(modelValidation(input)).toBe('gpt-4o');
    });

    test('accepts any model string without validation', () => {
      const input: ChatOptions = {
        messages: ['Hello'],
        model: 'future-model-xyz',
      };

      expect(modelValidation(input)).toBe('future-model-xyz');
    });

    test('throws error when no messages provided', async () => {
      const AsstDataOperationsProvider = {
        provideData: async () => new ManageAssistantsApi(),
      } as AsstDataOperationsProvider;

      const chatFn = chat('test-assistant', AsstDataOperationsProvider);
      const chatCompletionFn = chatCompletion(
        'test-assistant',
        AsstDataOperationsProvider,
      );

      const input = {} as ChatOptions;
      const inputCompletion = {} as ChatOptions;

      await expect(chatFn(input)).rejects.toThrow(
        'You must pass an object with required properties (`messages`) to chat with an assistant.',
      );
      await expect(chatCompletionFn(inputCompletion)).rejects.toThrow(
        'You must pass an object with required properties (`messages`) to chat with an assistant.',
      );
    });
  });
});
