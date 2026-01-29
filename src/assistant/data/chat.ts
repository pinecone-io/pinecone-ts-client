import {
  MessageModel,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import type { ChatModel } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ChatOptions } from './types';
import { PineconeArgumentError } from '../../errors';

export const chat = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
) => {
  return async (options: ChatOptions): Promise<ChatModel> => {
    validateChatOptions(options);

    const api = await apiProvider.provideData();
    const messages = messagesValidation(options) as MessageModel[];
    const model = modelValidation(options);

    return await api.chatAssistant({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      assistantName: assistantName,
      chatRequest: {
        messages: messages,
        stream: false,
        model: model,
        filter: options.filter,
        jsonResponse: options.jsonResponse,
        includeHighlights: options.includeHighlights,
        contextOptions: {
          topK: options.contextOptions?.topK,
          snippetSize: options.contextOptions?.snippetSize,
          multimodal: options.contextOptions?.multimodal,
          includeBinaryContent: options.contextOptions?.includeBinaryContent,
        },
      },
    });
  };
};

export const validateChatOptions = (options: ChatOptions) => {
  if (!options || !options.messages) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`messages`) to chat with an assistant.',
    );
  }

  if (options.model && typeof options.model !== 'string') {
    throw new PineconeArgumentError(
      `Invalid model: "${options.model}". Must be a string.`,
    );
  }
};

/**
 * Validates the messages passed to the Assistant.
 *
 * @param options - A {@link ChatRequest} object containing the messages to send to the Assistant.
 * @throws An Error `role` key is not one of `user` or `assistant`.
 * @throws An Error if the message object does not have exactly two keys: `role` and `content`.
 * @returns An array of {@link MessageModel} objects containing the messages to send to the Assistant.
 */
export const messagesValidation = (options: ChatOptions): MessageModel[] => {
  let messages: MessageModel[] = [];

  // If messages are passed as a list of strings:
  if (options.messages && typeof options.messages[0] == 'string') {
    // role defaults to user if not specified
    messages = options.messages.map((message) => {
      return { role: 'user', content: message };
    });
  }
  // If messages are passed as a list of objects:
  if (
    Array.isArray(options.messages) &&
    typeof options.messages[0] === 'object'
  ) {
    if (options.messages[0]['role']) {
      if (
        options.messages[0]['role'].toLowerCase() !== 'user' &&
        options.messages[0]['role'].toLowerCase() !== 'assistant'
      ) {
        throw new Error(
          'No role specified in message object. Must be one of "user" or "assistant"',
        );
      }
    }

    // Extract unique keys from all messages
    const keys: string[] = Array.from(
      new Set(options.messages.flatMap((message) => Object.keys(message))),
    );

    if (keys.length !== 2) {
      throw new Error(
        'Message object must have exactly two keys: "role" and "content"',
      );
    }

    // Cast messages after validating keys
    return (messages = options.messages as MessageModel[]);
  }

  return messages;
};

/**
 * Validates the model passed to the Assistant.
 *
 * @param options - A {@link ChatOptions} object containing the model to use for the Assistant.
 * @returns The model string to use, defaulting to 'gpt-4o' if not specified.
 */
export const modelValidation = (options: ChatOptions): string => {
  // default to GPT-4o for backward compatibility
  const model: string = options.model || 'gpt-4o';
  return model;
};
