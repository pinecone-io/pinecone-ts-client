import { chat } from '../chat';
import {
  ChatAssistantRequest,
  ChatModel,
  ManageAssistantsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';
import type { ChatOptions } from '../types';

const setupApiProvider = () => {
  const fakeChatAssistant: (req: ChatAssistantRequest) => Promise<ChatModel> =
    jest.fn().mockImplementation(() => Promise.resolve({}));

  const MAP = {
    chatAssistant: fakeChatAssistant,
  } as ManageAssistantsApi;
  const AsstDataOperationsProvider = {
    provideData: async () => MAP,
  } as AsstDataOperationsProvider;
  return { MAP, AsstDataOperationsProvider };
};

describe('chat', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls the API with basic message', async () => {
    const assistantName = 'test-assistant';
    const chatFn = chat(assistantName, asstOperationsProvider);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await chatFn(options);

    expect(mockApi.chatAssistant).toHaveBeenCalledWith({
      assistantName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      chatRequest: {
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
        model: 'gpt-4o',
        filter: undefined,
        jsonResponse: undefined,
        includeHighlights: undefined,
        contextOptions: {
          topK: undefined,
          snippetSize: undefined,
          multimodal: undefined,
          includeBinaryContent: undefined,
        },
      },
    });
  });

  test('passes contextOptions with multimodal parameters', async () => {
    const assistantName = 'test-assistant';
    const chatFn = chat(assistantName, asstOperationsProvider);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Show me charts' }],
      contextOptions: {
        topK: 10,
        snippetSize: 512,
        multimodal: true,
        includeBinaryContent: true,
      },
    };

    await chatFn(options);

    expect(mockApi.chatAssistant).toHaveBeenCalledWith({
      assistantName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      chatRequest: {
        messages: [{ role: 'user', content: 'Show me charts' }],
        stream: false,
        model: 'gpt-4o',
        filter: undefined,
        jsonResponse: undefined,
        includeHighlights: undefined,
        contextOptions: {
          topK: 10,
          snippetSize: 512,
          multimodal: true,
          includeBinaryContent: true,
        },
      },
    });
  });

  test('passes all chat options correctly', async () => {
    const assistantName = 'test-assistant';
    const chatFn = chat(assistantName, asstOperationsProvider);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4.1',
      temperature: 0.5,
      filter: { category: 'docs' },
      jsonResponse: true,
      includeHighlights: true,
      contextOptions: {
        topK: 15,
        snippetSize: 2048,
        multimodal: false,
        includeBinaryContent: false,
      },
    };

    await chatFn(options);

    expect(mockApi.chatAssistant).toHaveBeenCalledWith({
      assistantName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      chatRequest: {
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
        model: 'gpt-4.1',
        filter: { category: 'docs' },
        jsonResponse: true,
        includeHighlights: true,
        contextOptions: {
          topK: 15,
          snippetSize: 2048,
          multimodal: false,
          includeBinaryContent: false,
        },
      },
    });
  });
});
