import type {
  ChatCompletionAssistantRequest,
  ChatCompletionModel,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { messagesValidation, modelValidation } from './chat';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { RetryOnServerFailure } from '../../utils';
import type { ChatOptions } from './types';

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
export const chatCompletion = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (options: ChatOptions): Promise<ChatCompletionModel> => {
    if (!options.messages) {
      throw new Error('No messages passed to Assistant');
    }
    const api = await apiProvider.provideData();
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
