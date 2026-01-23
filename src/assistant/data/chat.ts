import {
  MessageModel,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import type { ChatModel } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ChatOptions } from './types';
import { ChatModelEnum } from './types';
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
          // use topK from contextOptions if provided, otherwise use topK from options
          topK: options.contextOptions?.topK || options.topK,
          snippetSize: options.contextOptions?.snippetSize,
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

  if (options.model) {
    if (
      typeof options.model !== 'string' ||
      !Object.values(ChatModelEnum).includes(options.model as ChatModelEnum)
    ) {
      throw new PineconeArgumentError(
        `Invalid model: "${options.model}". Must be one of: ${Object.values(
          ChatModelEnum,
        )
          .map((model) => `"${model}"`)
          .join(', ')}.`,
      );
    }
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
 * @param options - A {@link ChatRequest} object containing the model to use for the Assistant.
 * @throws An Error if the model is not one of the available models as outlined in {@link ChatModelEnum}.
 */
export const modelValidation = (options: ChatOptions) => {
  const allowedModels = Object.values(ChatModelEnum);
  // default to GPT-4o for backward compatibility
  let model: ChatModelEnum = ChatModelEnum.Gpt4o;
  if (options.model) {
    if (!allowedModels.includes(options.model as ChatModelEnum)) {
      throw new Error(
        `Invalid model specified. Must be one of ${allowedModels
          .map((m) => `"${m}"`)
          .join(', ')}:`,
      );
    } else {
      model = options.model as ChatModelEnum;
    }
  }
  return model;
};
