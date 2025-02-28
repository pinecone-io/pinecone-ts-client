import type {
  ChatCompletionAssistantRequest,
  ChatCompletionModel,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import {
  messagesValidation,
  modelValidation,
  validateChatOptions,
} from './chat';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { RetryOnServerFailure } from '../../utils';
import type { ChatCompletionOptions } from './types';

export const chatCompletion = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (
    options: ChatCompletionOptions
  ): Promise<ChatCompletionModel> => {
    validateChatOptions(options);

    const api = await apiProvider.provideData();
    const messages = messagesValidation(options) as MessageModel[];
    const model = modelValidation(options);
    const request: ChatCompletionAssistantRequest = {
      assistantName: assistantName,
      searchCompletions: {
        messages: messages,
        stream: false,
        model: model,
        filter: options.filter,
      },
    };
    const retryWrapper = new RetryOnServerFailure(() =>
      api.chatCompletionAssistant(request)
    );

    return await retryWrapper.execute();
  };
};
