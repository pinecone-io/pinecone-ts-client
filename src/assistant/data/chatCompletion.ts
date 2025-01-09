import {
  ChatCompletionAssistantRequest,
  ChatCompletionModel,
  ManageAssistantsApi as ManageAssistantsApiData,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { messagesValidation, modelValidation } from './chat';
import { RetryOnServerFailure } from '../../utils';

export interface ChatCompletionRequest {
  messages: string[] | Array<{ [key: string]: string }>;
  stream?: boolean;
  model?: string;
  filter?: object;
}

/**
 * Sends a message to the Assistant and receives a response. Response is compatible with
 * [OpenAI's Chat Completion API](https://platform.openai.com/docs/guides/text-generation. Retries the request if the server fails.
 *
 * See {@link chat} for example usage.
 *
 * @param assistantName - The name of the Assistant to send the message to.
 * @param api - The API object to use to send the request.
 * @throws An Error if no messages are provided.
 * @throws an Error if the message object is not formatted correctly.
 * @throws an Error if the model is not one of the available models.
 * @returns A promise that resolves to a {@link ChatCompletionModel} object containing the response from the Assistant.
 */
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
    const retryWrapper = new RetryOnServerFailure(() =>
      api.chatCompletionAssistant(request)
    );

    return retryWrapper.execute();
  };
};
