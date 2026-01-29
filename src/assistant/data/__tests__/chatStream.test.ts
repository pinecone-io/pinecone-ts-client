import { chatStream } from '../chatStream';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';
import type { ChatOptions } from '../types';
import { PineconeConfiguration } from '../../../data';

const mockFetch = jest.fn();
jest.mock('../../../utils', () => {
  const actual = jest.requireActual('../../../utils');
  return {
    ...actual,
    getFetch: () => mockFetch,
    buildUserAgent: () => 'TestUserAgent',
    ChatStream: jest.fn().mockImplementation(() => ({})),
  };
});

const buildMockFetchResponse = (body: ReadableStream) =>
  mockFetch.mockResolvedValue({
    ok: true,
    body: body,
  });

describe('chatStream', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
  } as PineconeConfiguration;
  const mockAssistantName = 'test-assistant';
  const mockApiProvider = {
    provideHostUrl: async () => 'https://prod-1-data.ke.pinecone.io/assistant',
  } as AsstDataOperationsProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockStream = new ReadableStream();
    buildMockFetchResponse(mockStream);
  });

  test('sends basic chat request with correct body structure', async () => {
    const streamFn = chatStream(mockAssistantName, mockApiProvider, mockConfig);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Api-Key': 'test-api-key',
          'User-Agent': 'TestUserAgent',
          'X-Pinecone-Api-Version': expect.any(String),
        }),
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
          model: 'gpt-4o',
          filter: undefined,
          json_response: undefined,
          include_highlights: undefined,
          context_options: undefined,
        }),
      }),
    );
  });

  test('includes context_options with multimodal parameters', async () => {
    const streamFn = chatStream(mockAssistantName, mockApiProvider, mockConfig);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Show me charts' }],
      contextOptions: {
        topK: 10,
        snippetSize: 512,
        multimodal: true,
        includeBinaryContent: true,
      },
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Show me charts' }],
          stream: true,
          model: 'gpt-4o',
          filter: undefined,
          json_response: undefined,
          include_highlights: undefined,
          context_options: {
            top_k: 10,
            snippet_size: 512,
            multimodal: true,
            include_binary_content: true,
          },
        }),
      }),
    );
  });

  test('includes context_options with multimodal false', async () => {
    const streamFn = chatStream(mockAssistantName, mockApiProvider, mockConfig);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
      contextOptions: {
        multimodal: false,
        includeBinaryContent: false,
      },
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
          model: 'gpt-4o',
          filter: undefined,
          json_response: undefined,
          include_highlights: undefined,
          context_options: {
            top_k: undefined,
            snippet_size: undefined,
            multimodal: false,
            include_binary_content: false,
          },
        }),
      }),
    );
  });

  test('includes all chat options with snake_case field names', async () => {
    const streamFn = chatStream(mockAssistantName, mockApiProvider, mockConfig);

    const options: ChatOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4.1',
      temperature: 0.7,
      filter: { category: 'docs' },
      jsonResponse: true,
      includeHighlights: true,
      contextOptions: {
        topK: 15,
        snippetSize: 1024,
        multimodal: true,
        includeBinaryContent: false,
      },
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
          model: 'gpt-4.1',
          filter: { category: 'docs' },
          json_response: true,
          include_highlights: true,
          context_options: {
            top_k: 15,
            snippet_size: 1024,
            multimodal: true,
            include_binary_content: false,
          },
        }),
      }),
    );
  });
});
