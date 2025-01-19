import { uploadFileClosed } from '../uploadFile';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { AssistantHostSingleton } from '../../assistantHostSingleton';

jest.mock('axios');
jest.mock('fs');
jest.mock('form-data');
jest.mock('../../assistantHostSingleton');

const mockResponse = {
  data: {
    name: 'test.txt',
    id: 'test-id',
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    status: 'ready',
  },
};

describe('uploadFileClosed', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    additionalHeaders: {
      'Custom-Header': 'test',
    },
  };

  const mockAssistantName = 'test-assistant';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);
    (AssistantHostSingleton.getHostUrl as jest.Mock).mockResolvedValue(
      'https://prod-1-data.ke.pinecone.io/assistant'
    );
  });

  test('throws error when file path is not provided', async () => {
    const upload = uploadFileClosed(mockAssistantName, mockConfig);
    await expect(upload({ path: '' })).rejects.toThrow('File path is required');
  });

  test('correctly builds URL without metadata', async () => {
    const upload = uploadFileClosed(mockAssistantName, mockConfig);
    await upload({ path: 'test.txt' });

    expect(axios.post).toHaveBeenCalledWith(
      'https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant',
      expect.any(FormData),
      expect.any(Object)
    );
  });

  test('correctly builds URL with metadata', async () => {
    const metadata = { key: 'value' };
    const upload = uploadFileClosed(mockAssistantName, mockConfig);
    await upload({ path: 'test.txt', metadata });

    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    expect(axios.post).toHaveBeenCalledWith(
      `https://prod-1-data.ke.pinecone.io/assistant/files/test-assistant?metadata=${encodedMetadata}`,
      expect.any(FormData),
      expect.any(Object)
    );
  });

  test('includes correct headers in request', async () => {
    const upload = uploadFileClosed(mockAssistantName, mockConfig);
    await upload({ path: 'test.txt' });

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Api-Key': 'test-api-key',
          'Custom-Header': 'test',
          'X-Pinecone-Api-Version': expect.any(String),
        }),
      })
    );
  });

  test('creates form data with file stream', async () => {
    const mockStream = { mock: 'stream' };
    (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

    const upload = uploadFileClosed(mockAssistantName, mockConfig);
    await upload({ path: 'test.txt' });

    expect(fs.createReadStream).toHaveBeenCalledWith('test.txt');
    expect(FormData.prototype.append).toHaveBeenCalledWith('file', mockStream);
  });
});
