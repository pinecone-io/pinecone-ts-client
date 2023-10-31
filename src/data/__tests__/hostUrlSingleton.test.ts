import { HostUrlSingleton } from '../hostUrlSingleton';

const mockDescribeIndex = jest.fn();

jest.mock('../../control', () => {
  const realControl = jest.requireActual('../../control');

  return {
    ...realControl,
    describeIndex: () => mockDescribeIndex,
  };
});

describe('HostUrlSingleton', () => {
  afterEach(() => {
    HostUrlSingleton._reset();
    mockDescribeIndex.mockReset();
  });

  test('calls describeIndex to resolve host for a specific apiKey and indexName, prepends protocol to host', async () => {
    const testHost = '123-456.pinecone.io';
    const testIndex = 'index-1';
    const pineconeConfig = {
      apiKey: 'api-key-1',
    };
    mockDescribeIndex.mockResolvedValue({
      database: {
        name: 'index-1',
        dimensions: 10,
        metric: 'cosine',
        pods: 1,
        replicas: 1,
        shards: 1,
        podType: 'p1.x1',
      },
      status: { ready: true, state: 'Ready', host: testHost },
    });

    const hostUrl = await HostUrlSingleton.getHostUrl(
      pineconeConfig,
      testIndex
    );
    expect(hostUrl).toEqual(`https://${testHost}`);
    expect(mockDescribeIndex).toHaveBeenCalledWith(testIndex);
  });

  test('calls describeIndex once per apiKey and indexName', async () => {
    const testHost = '123-456.pinecone.io';
    const testHost2 = '654-321.pinecone.io';
    const testIndex = 'index-1';
    const testIndex2 = 'index-2';
    const pineconeConfig = {
      apiKey: 'api-key-1',
    };
    mockDescribeIndex
      .mockResolvedValueOnce({
        database: {
          name: testIndex,
          dimensions: 10,
          metric: 'cosine',
          pods: 1,
          replicas: 1,
          shards: 1,
          podType: 'p1.x1',
        },
        status: { ready: true, state: 'Ready', host: testHost },
      })
      .mockResolvedValueOnce({
        database: {
          name: testIndex2,
          dimensions: 10,
          metric: 'cosine',
          pods: 1,
          replicas: 1,
          shards: 1,
          podType: 'p1.x1',
        },
        status: { ready: true, state: 'Ready', host: testHost2 },
      });

    const hostUrl = await HostUrlSingleton.getHostUrl(
      pineconeConfig,
      testIndex
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
    expect(hostUrl).toEqual(`https://${testHost}`);

    // call again for same indexName, no additional calls
    const hostUrl2 = await HostUrlSingleton.getHostUrl(
      pineconeConfig,
      testIndex
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
    expect(hostUrl2).toEqual(`https://${testHost}`);

    // new indexName means we call describeIndex again
    // to resolve the new host
    const hostUrl3 = await HostUrlSingleton.getHostUrl(
      pineconeConfig,
      testIndex2
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(2);
    expect(hostUrl3).toEqual(`https://${testHost2}`);
  });
});
