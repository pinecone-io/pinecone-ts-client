import {
  ChatAssistantRequest,
  type ChatModel,
  ChatModelEnum,
  ManageAssistantsApi as ManageAssistantsApiData,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { RetryOnServerFailure } from '../../utils';

/**
 * Validates the messages passed to the Assistant.
 *
 * @param options - A {@link ChatRequest} object containing the messages to send to the Assistant.
 * @throws An Error `role` key is not one of `user` or `assistant`.
 * @throws An Error if the message object does not have exactly two keys: `role` and `content`.
 * @returns An array of {@link MessageModel} objects containing the messages to send to the Assistant.
 */
export const messagesValidation = (options: ChatRequest): MessageModel[] => {
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
          'No role specified in message object. Must be one of "user" or "assistant"'
        );
      }
    }

    // Extract unique keys from all messages
    const keys: string[] = Array.from(
      new Set(options.messages.flatMap((message) => Object.keys(message)))
    );

    if (keys.length !== 2) {
      throw new Error(
        'Message object must have exactly two keys: "role" and "content"'
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
export const modelValidation = (options: ChatRequest) => {
  // Make sure passed string for 'model' matches one of the Enum values; default to Gpt4o
  let model: ChatModelEnum = ChatModelEnum.Gpt4o;
  if (options.model) {
    if (!Object.values(ChatModelEnum).toString().includes(options.model)) {
      throw new Error(
        'Invalid model specified. Must be one of "gpt-4o" or "claude-3-5-sonnet"'
      );
    } else {
      model = options.model as ChatModelEnum;
    }
  }
  return model;
};

/**
 * The `ChatRequest` interface describes the request format for sending a message to an Assistant.
 */
export interface ChatRequest {
  /**
   * The messages to send to the Assistant. Can be a list of strings or a list of objects. If sent as a list of
   * objects, must have exactly two keys: `role` and `content`. The `role` key can only be one of `user` or `assistant`.
   */
  messages: string[] | Array<{ [key: string]: string }>;
  /**
   * If false, the Assistant will return a single JSON response. If true, the Assistant will return a stream of responses.
   */
  stream?: boolean;
  /**
   * The large language model to use for answer generation. Must be one outlined in {@link ChatModelEnum}.
   */
  model?: string;
  /**
   * A filter against which documents can be retrieved.
   */
  filter?: object;
}

/**
 * Sends a message to the Assistant and receives a response. Retries the request if the server fails.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistantName = 'test1';
 * const assistant = pc.Assistant(assistantName);
 * const chatResp = await assistant.chat({messages: [{role: 'user', content: "What is the capital of France?"}]});
 * // {
 * //  id: '000000000000000023e7fb015be9d0ad',
 * //  finishReason: 'stop',
 * //  message: {
 * //    role: 'assistant',
 * //    content: 'The capital of France is Paris.'
 * //  },
 * //  model: 'gpt-4o-2024-05-13',
 * //  citations: [ { position: 209, references: [Array] } ],
 * //  usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
 * }
 * ```
 *
 * @param assistantName - The name of the Assistant to send the message to.
 * @param api - The API object to use to send the request.
 * @throws An Error if no messages are provided.
 * @throws an Error if the message object is not formatted correctly.
 * @throws an Error if the model is not one of the available models.
 * @returns A promise that resolves to a {@link ChatModel} object containing the response from the Assistant.
 */
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

    const retryWrapper = new RetryOnServerFailure(() =>
      api.chatAssistant(request)
    );

    return retryWrapper.execute();
  };
};
