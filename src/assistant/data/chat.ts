import {
  ChatAssistantRequest,
  type ChatModel,
  ChatModelEnum,
  ManageAssistantsApi as ManageAssistantsApiData,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { messagesValidation, modelValidation } from './chatValidation';

export interface ChatRequest {
  messages: string[] | Array<{ [key: string]: string }>;
  stream?: boolean;
  model?: string;
  filter?: object;
}

export const chatClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (options: ChatRequest): Promise<ChatModel> => {
    if (!options.messages) {
      throw new Error('No messages passed to Assistant');
    }
    const messages = messagesValidation(options) as MessageModel[];
    const model = modelValidation(options);
    const request: ChatAssistantRequest = {
      assistantName: assistantName,
      chat: {
        messages: messages,
        stream: options.stream,
        model: model,
        filter: options.filter,
      },
    };
    return api.chatAssistant(request);
  };
};