import {
  ChatAssistantRequest,
  type ChatModel,
  ChatModelEnum,
  ManageAssistantsApi as ManageAssistantsApiData,
  MessageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { RetryOnServerFailure } from '../../utils';

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

    const retryWrapper = new RetryOnServerFailure(() =>
      api.chatAssistant(request)
    );

    return retryWrapper.execute();
  };
};
