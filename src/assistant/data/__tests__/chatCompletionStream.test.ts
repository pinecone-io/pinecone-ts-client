import { chatCompletionStream } from '../chatCompletionStream';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';
import type { ChatCompletionOptions } from '../types';
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

describe('chatCompletionStream', () => {
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

  test('sends basic completion request with correct body structure', async () => {
    const streamFn = chatCompletionStream(
      mockAssistantName,
      mockApiProvider,
      mockConfig,
    );

    const options: ChatCompletionOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant/chat/completions',
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
          temperature: undefined,
          filter: undefined,
        }),
      }),
    );
  });

  test('forwards temperature into the outgoing body', async () => {
    const streamFn = chatCompletionStream(
      mockAssistantName,
      mockApiProvider,
      mockConfig,
    );

    const options: ChatCompletionOptions = {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4.1',
      temperature: 0.3,
      filter: { category: 'docs' },
    };

    await streamFn(options);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/chat/test-assistant/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
          model: 'gpt-4.1',
          temperature: 0.3,
          filter: { category: 'docs' },
        }),
      }),
    );
  });
});
