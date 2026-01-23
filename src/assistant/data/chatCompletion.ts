import type {
  ChatCompletionModel,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/assistant_data';
import {
  messagesValidation,
  modelValidation,
  validateChatOptions,
} from './chat';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ChatCompletionOptions } from './types';

export const chatCompletion = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
) => {
  return async (
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionModel> => {
    validateChatOptions(options);

    const api = await apiProvider.provideData();
    const messages = messagesValidation(options) as MessageModel[];
    const model = modelValidation(options);

    return await api.chatCompletionAssistant({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      assistantName: assistantName,
      searchCompletions: {
        messages: messages,
        stream: false,
        model: model,
        filter: options.filter,
      },
    });
  };
};
