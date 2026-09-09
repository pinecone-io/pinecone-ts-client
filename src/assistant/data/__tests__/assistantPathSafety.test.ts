import { chatStream } from '../chatStream';
import { chatCompletionStream } from '../chatCompletionStream';
import { uploadFile } from '../uploadFile';
import { upsertFile } from '../upsertFile';
import { sendFileMultipart } from '../fileUpload';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';
import { PineconeArgumentError } from '../../../errors';
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
jest.mock('../fileUpload', () => ({
  sendFileMultipart: jest.fn().mockResolvedValue({}),
}));

const HOST = 'https://prod-1-data.ke.pinecone.io/assistant';
const config = { apiKey: 'test-api-key' } as PineconeConfiguration;
const apiProvider = {
  provideHostUrl: async () => HOST,
} as AsstDataOperationsProvider;

const chatOptions = { messages: [{ role: 'user', content: 'Hello' }] };

type Invoke = (assistantName: string) => Promise<unknown>;

/**
 * These four operations build their request path by hand rather than through a
 * generated API class, so they never reach the middleware that guards the rest
 * of the client.
 */
const operations: Array<[string, Invoke, (encoded: string) => string]> = [
  [
    'chatStream',
    (assistantName) =>
      chatStream(assistantName, apiProvider, config)(chatOptions),
    (encoded) => `/assistant/chat/${encoded}`,
  ],
  [
    'chatCompletionStream',
    (assistantName) =>
      chatCompletionStream(assistantName, apiProvider, config)(chatOptions),
    (encoded) => `/assistant/chat/${encoded}/chat/completions`,
  ],
  [
    'uploadFile',
    (assistantName) =>
      uploadFile(assistantName, apiProvider, config)({ path: 'report.pdf' }),
    (encoded) => `/assistant/files/${encoded}`,
  ],
  [
    'upsertFile',
    (assistantName) =>
      upsertFile(
        assistantName,
        apiProvider,
        config,
      )({ assistantFileId: 'file-1', path: 'report.pdf' }),
    (encoded) => `/assistant/files/${encoded}/file-1`,
  ],
];

const requestedUrl = (): string => {
  const fromFetch = mockFetch.mock.calls[0]?.[0];
  if (fromFetch) {
    return fromFetch as string;
  }
  return (sendFileMultipart as jest.Mock).mock.calls[0][1] as string;
};

describe.each(operations)(
  '%s assistant name in the path',
  (_operation, invoke, expectedPath) => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockFetch.mockResolvedValue({ ok: true, body: new ReadableStream() });
    });

    test.each(['.', '..'])(
      'an assistant name of %p is refused',
      async (assistantName) => {
        await expect(invoke(assistantName)).rejects.toThrow(
          PineconeArgumentError,
        );
        expect(mockFetch).not.toHaveBeenCalled();
        expect(sendFileMultipart).not.toHaveBeenCalled();
      },
    );

    test.each([
      ['my-assistant', 'my-assistant'],
      ['a/b', 'a%2Fb'],
      ['a.b', 'a.b'],
      ['%2e%2e', '%252e%252e'],
      ['...', '...'],
    ])('an assistant name of %p reaches %p', async (assistantName, encoded) => {
      await invoke(assistantName);
      expect(new URL(requestedUrl()).pathname).toBe(expectedPath(encoded));
    });
  },
);

describe('upsertFile file id in the path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(['.', '..'])(
    'a file id of %p is refused',
    async (assistantFileId) => {
      await expect(
        upsertFile(
          'my-assistant',
          apiProvider,
          config,
        )({ assistantFileId, path: 'report.pdf' }),
      ).rejects.toThrow(PineconeArgumentError);
      expect(sendFileMultipart).not.toHaveBeenCalled();
    },
  );
});
