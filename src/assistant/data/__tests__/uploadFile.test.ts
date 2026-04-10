import { uploadFile } from '../uploadFile';
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
  data: {
    name: 'test.txt',
    id: 'test-id',
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    status: 'ready',
  },
};

const mockConfig = {
  apiKey: 'test-api-key',
  additionalHeaders: {
    'Custom-Header': 'test',
  },
};

const mockAssistantName = 'test-assistant';

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
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(upload(undefined as any)).rejects.toThrow(
      'You must pass an object with required properties',
    );
  });

  test('throws when path is empty string', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(upload({ path: '' })).rejects.toThrow(
      'You must pass an object with required properties',
    );
  });

  test('throws when file is provided without fileName', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await expect(
      upload({ file: Buffer.from('data'), fileName: '' } as any),
    ).rejects.toThrow('`fileName` is required when uploading via `file`.');
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
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt' });
    expect(fs.promises.readFile).toHaveBeenCalledWith('test.txt');
  });

  test('uses retrying fetch', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt' });
    expect(mockRetryingFetch).toHaveBeenCalled();
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });

  test('sends FormData body', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt' });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });

  test('builds URL with metadata', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const metadata = { key: 'value' };
    await upload({ path: 'test.txt', metadata });

    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?metadata=${encodedMetadata}`,
      expect.anything(),
    );
  });

  test('builds URL with multimodal=true', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt', multimodal: true });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?multimodal=true',
      expect.anything(),
    );
  });

  test('builds URL with multimodal=false', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt', multimodal: false });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?multimodal=false',
      expect.anything(),
    );
  });

  test('builds URL with both metadata and multimodal', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const metadata = { key: 'value' };
    await upload({ path: 'test.txt', metadata, multimodal: true });
    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?metadata=${encodedMetadata}&multimodal=true`,
      expect.anything(),
    );
  });

  test('includes required headers', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ path: 'test.txt' });
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
// Buffer input — uses retrying fetch
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

  test('uses retrying fetch', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ file: Buffer.from('pdf content'), fileName: 'doc.pdf' });
    expect(mockRetryingFetch).toHaveBeenCalled();
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });

  test('sends FormData body', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    await upload({ file: Buffer.from('pdf content'), fileName: 'doc.pdf' });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });

  test('builds URL with metadata', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const metadata = { source: 'upload' };
    await upload({
      file: Buffer.from('data'),
      fileName: 'doc.txt',
      metadata,
    });
    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?metadata=${encodedMetadata}`,
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// Blob input — uses retrying fetch
// ---------------------------------------------------------------------------

describe('Blob input', () => {
  beforeEach(() => {
    buildMockFetchResponse(
      mockRetryingFetch,
      true,
      200,
      JSON.stringify(mockResponse),
    );
  });

  test('uses retrying fetch', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const blob = new Blob(['pdf content'], { type: 'application/pdf' });
    await upload({ file: blob, fileName: 'doc.pdf' });
    expect(mockRetryingFetch).toHaveBeenCalled();
    expect(mockNonRetryingFetch).not.toHaveBeenCalled();
  });

  test('sends FormData body', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const blob = new Blob(['pdf content'], { type: 'application/pdf' });
    await upload({ file: blob, fileName: 'doc.pdf' });
    expect(mockRetryingFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
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

  test('uses non-retrying fetch', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const stream = Readable.from(['pdf content']);
    await upload({ file: stream, fileName: 'doc.pdf' });
    expect(mockNonRetryingFetch).toHaveBeenCalled();
    expect(mockRetryingFetch).not.toHaveBeenCalled();
  });

  test('sends a ReadableStream body (not FormData)', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const stream = Readable.from(['pdf content']);
    await upload({ file: stream, fileName: 'doc.pdf' });
    expect(mockNonRetryingFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(ReadableStream),
      }),
    );
  });

  test('sets multipart Content-Type header with boundary', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const stream = Readable.from(['pdf content']);
    await upload({ file: stream, fileName: 'doc.pdf' });
    const [, init] = mockNonRetryingFetch.mock.calls[0];
    expect(init.headers['Content-Type']).toMatch(
      /^multipart\/form-data; boundary=/,
    );
  });

  test('builds URL with metadata', async () => {
    const upload = uploadFile(mockAssistantName, mockApiProvider, mockConfig);
    const stream = Readable.from(['data']);
    const metadata = { source: 'stream' };
    await upload({ file: stream, fileName: 'doc.txt', metadata });
    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    expect(mockNonRetryingFetch).toHaveBeenCalledWith(
      `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?metadata=${encodedMetadata}`,
      expect.anything(),
    );
  });
});
