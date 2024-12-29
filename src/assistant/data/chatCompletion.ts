import {
  ChatCompletionAssistantRequest,
  ChatCompletionModel,
  ManageAssistantsApi as ManageAssistantsApiData,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { messagesValidation, modelValidation } from './chat';

export interface ChatCompletionRequest {
  messages: string[] | Array<{ [key: string]: string }>;
  stream?: boolean;
  model?: string;
  filter?: object;
}

export const chatCompletionClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (
    options: ChatCompletionRequest
  ): Promise<ChatCompletionModel> => {
    if (!options.messages) {
      throw new Error('No messages passed to Assistant');
    }
    const messages = messagesValidation(options) as MessageModel[];
    const model = modelValidation(options);
    const request: ChatCompletionAssistantRequest = {
      assistantName: assistantName,
      searchCompletions: {
        messages: messages,
        stream: options.stream,
        model: model,
        filter: options.filter,
      },
    };
    return api.chatCompletionAssistant(request);
  };
};
