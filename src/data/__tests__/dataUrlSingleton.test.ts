import { DataUrlSingleton } from '../dataUrlSingleton';
import type { PineconeConfiguration } from '../types';

describe('DataUrlSingleton', () => {
  let pinecone, mockDescribeIndex;
  beforeEach(() => {
    mockDescribeIndex = jest.fn();
    pinecone = {
      describeIndex: mockDescribeIndex,
      getConfig: () => {
        return {
          apiKey: 'test-api-key',
          environment: 'gcp-free',
        } as PineconeConfiguration;
      },
    };

    mockDescribeIndex.mockResolvedValue({
      database: {
        name: 'foo-index',
        dimension: 128,
      },
      status: {
        host: 'dataurl.pinecone.io',
      },
    });
  });
  afterEach(() => {
    DataUrlSingleton._reset();
  });

  test('getDataUrl returns cached value', async () => {
    DataUrlSingleton.setDataUrl(pinecone, 'foo-index', 'www.example.com');
    DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
  });

  test('only makes API call once per api key', async () => {
    const url = await DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
    expect(url).toEqual('https://dataurl.pinecone.io');
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);

    const url2 = await DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
    expect(url2).toEqual('https://dataurl.pinecone.io');
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);

    await DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
    await DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
    await DataUrlSingleton.getDataUrl(pinecone, 'foo-index');
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
  });
});
