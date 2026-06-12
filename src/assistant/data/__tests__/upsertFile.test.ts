import { upsertFile } from '../upsertFile';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';

const mockRetryingFetch = jest.fn();
const mockNonRetryingFetch = jest.fn();

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('path');
jest.mock('../../../utils', () => {
  const actual = jest.requireActual('../../../utils');
  return {
    ...actual,
    getFetch: () => mockRetryingFetch,
    getNonRetryingFetch: () => mockNonRetryingFetch,
    buildUserAgent: () => 'TestUserAgent',
  };
});

const buildMockFetchResponse = (
  mock: jest.Mock,
  isSuccess: boolean,
  status: number,
  body: string,
) =>
  mock.mockResolvedValue({
    ok: isSuccess,
    status: status,
    json: async () => JSON.parse(body),
  });

const mockResponse = {
  id: 'op-id',
  operationType: 'upsert_file',
  fileId: 'file-id-1',
  status: 'Processing',
  createdOn: new Date().toISOString(),
};

const mockConfig = {
  apiKey: 'test-api-key',
  additionalHeaders: {
    'Custom-Header': 'test',
  },
};

const mockAssistantName = 'test-assistant';
const mockFileId = 'file-id-1';
const baseUrl = `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant/${mockFileId}`;

const mockApiProvider = {
  provideHostUrl: async () => 'https://prod-1-data.ke.pinecone.io/assistant',
} as AsstDataOperationsProvider;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  test('throws when called with no options', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(upsert(undefined as any)).rejects.toThrow(
      'You must pass an object with required properties',
    );
  });

  test('throws when assistantFileId is missing', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(upsert({ path: 'test.txt' } as any)).rejects.toThrow(
      'You must pass the `assistantFileId` of the file to upsert.',
    );
  });

  test('throws when neither path nor file is provided', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(
      upsert({ assistantFileId: mockFileId } as any),
    ).rejects.toThrow('You must pass either `path` or `file` + `fileName`');
  });

  test('throws when file is provided without fileName', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(
      upsert({
        assistantFileId: mockFileId,
        file: Buffer.from('data'),
        fileName: '',
      } as any),
    ).rejects.toThrow('`fileName` is required when upserting via `file`.');
  });
});

// ---------------------------------------------------------------------------
// path input — uses retrying fetch
// ---------------------------------------------------------------------------

describe('path input', () => {
  const mockFileContent = Buffer.from('test file content');

  beforeEach(() => {
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);
    (path.basename as jest.Mock).mockReturnValue('test.txt');
    buildMockFetchResponse(
      mockRetryingFetch,
      true,
      200,
      JSON.stringify(mockResponse),
    );
  });

  test('reads file asynchronously from path', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({ assistantFileId: mockFileId, path: 'test.txt' });
    expect(fs.promises.readFile).toHaveBeenCalledWith('test.txt');
  });

  test('sends a PUT FormData body to the file-id URL', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({ assistantFileId: mockFileId, path: 'test.txt' });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      baseUrl,
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(FormData),
      }),
    );
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });

  test('does not send metadata in the form body', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({ assistantFileId: mockFileId, path: 'test.txt' });
    const body = mockRetryingFetch.mock.calls[0][1].body as FormData;
    expect(body.get('metadata')).toBeNull();
    expect(body.get('file')).not.toBeNull();
  });

  test('builds URL with multimodal=true', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({
      assistantFileId: mockFileId,
      path: 'test.txt',
      multimodal: true,
    });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      `${baseUrl}?multimodal=true`,
      expect.anything(),
    );
  });

  test('includes required headers', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({ assistantFileId: mockFileId, path: 'test.txt' });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Api-Key': 'test-api-key',
          'User-Agent': 'TestUserAgent',
          'X-Pinecone-Api-Version': expect.any(String),
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Buffer / Blob input — uses retrying fetch
// ---------------------------------------------------------------------------

describe('Buffer input', () => {
  beforeEach(() => {
    buildMockFetchResponse(
      mockRetryingFetch,
      true,
      200,
      JSON.stringify(mockResponse),
    );
  });

  test('sends a PUT FormData body via retrying fetch', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    await upsert({
      assistantFileId: mockFileId,
      file: Buffer.from('pdf content'),
      fileName: 'doc.pdf',
    });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      baseUrl,
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(FormData),
      }),
    );
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });
});

describe('Blob input', () => {
  beforeEach(() => {
    buildMockFetchResponse(
      mockRetryingFetch,
      true,
      200,
      JSON.stringify(mockResponse),
    );
  });

  test('sends a PUT FormData body via retrying fetch', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    const blob = new Blob(['pdf content'], { type: 'application/pdf' });
    await upsert({
      assistantFileId: mockFileId,
      file: blob,
      fileName: 'doc.pdf',
    });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      baseUrl,
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(FormData),
      }),
    );
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ReadableStream input — uses non-retrying fetch
// ---------------------------------------------------------------------------

describe('ReadableStream input', () => {
  beforeEach(() => {
    buildMockFetchResponse(
      mockNonRetryingFetch,
      true,
      200,
      JSON.stringify(mockResponse),
    );
  });

  test('sends a PUT ReadableStream body via non-retrying fetch', async () => {
    const upsert = upsertFile(mockAssistantName, mockApiProvider, mockConfig);
    const stream = Readable.from(['pdf content']);
    await upsert({
      assistantFileId: mockFileId,
      file: stream,
      fileName: 'doc.pdf',
    });
    expect(mockNonRetryingFetch).toHaveBeenCalledWith(
      baseUrl,
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(ReadableStream),
      }),
    );
    expect(mockRetryingFetch).not.toHaveBeenCalled();
  });
});
