import { IndexHostSingleton } from '../indexHostSingleton';

const mockDescribeIndex = jest.fn();

jest.mock('../../control', () => {
  const realControl = jest.requireActual('../../control');

  return {
    ...realControl,
    describeIndex: () => mockDescribeIndex,
  };
});

describe('IndexHostSingleton', () => {
  afterEach(() => {
    IndexHostSingleton._reset();
    mockDescribeIndex.mockReset();
  });

  test('calls describeIndex to resolve host for a specific apiKey and indexName, prepends protocol to host', async () => {
    const testHost = '123-456.pinecone.io';
    const testIndex = 'index-1';
    const pineconeConfig = {
      apiKey: 'api-key-1',
    };
    mockDescribeIndex.mockResolvedValue({
      name: 'index-1',
      dimensions: 10,
      metric: 'cosine',
      host: testHost,
      spec: { pod: { pods: 1, replicas: 1, shards: 1, podType: 'p1.x1' } },
      status: { ready: true, state: 'Ready' },
    });

    const hostUrl = await IndexHostSingleton.getHostUrl(
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
        name: testIndex,
        dimensions: 10,
        metric: 'cosine',
        host: testHost,
        spec: { pod: { pods: 1, replicas: 1, shards: 1, podType: 'p1.x1' } },
        status: { ready: true, state: 'Ready' },
      })
      .mockResolvedValueOnce({
        name: testIndex2,
        dimensions: 10,
        metric: 'cosine',
        host: testHost2,
        spec: { pod: { pods: 1, replicas: 1, shards: 1, podType: 'p1.x1' } },
        status: { ready: true, state: 'Ready' },
      });

    const hostUrl = await IndexHostSingleton.getHostUrl(
      pineconeConfig,
      testIndex
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
    expect(hostUrl).toEqual(`https://${testHost}`);

    // call again for same indexName, no additional calls
    const hostUrl2 = await IndexHostSingleton.getHostUrl(
      pineconeConfig,
      testIndex
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
    expect(hostUrl2).toEqual(`https://${testHost}`);

    // new indexName means we call describeIndex again
    // to resolve the new host
    const hostUrl3 = await IndexHostSingleton.getHostUrl(
      pineconeConfig,
      testIndex2
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(2);
    expect(hostUrl3).toEqual(`https://${testHost2}`);
  });

  test('_set, _delete, and _reset work as expected', async () => {
    const pineconeConfig = { apiKey: 'test-key' };

    mockDescribeIndex.mockResolvedValue({
      name: 'index-1',
      dimensions: 10,
      metric: 'cosine',
      host: 'test-host',
      spec: { pod: { pods: 1, replicas: 1, shards: 1, podType: 'p1.x1' } },
      status: { ready: true, state: 'Ready' },
    });

    // _set test
    IndexHostSingleton._set(pineconeConfig, 'index-1', 'test-host');
    const host1 = await IndexHostSingleton.getHostUrl(
      pineconeConfig,
      'index-1'
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(0);
    expect(host1).toEqual('https://test-host');

    // _delete test
    IndexHostSingleton._delete(pineconeConfig, 'index-1');
    const host2 = await IndexHostSingleton.getHostUrl(
      pineconeConfig,
      'index-1'
    );
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
    expect(host2).toBe('https://test-host');
  });

  test('_set does not cache empty hostUrl values', async () => {
    const pineconeConfig = { apiKey: 'test-key' };

    mockDescribeIndex.mockResolvedValue({
      name: 'index-1',
      dimensions: 10,
      metric: 'cosine',
      host: 'test-host',
      spec: { pod: { pods: 1, replicas: 1, shards: 1, podType: 'p1.x1' } },
      status: { ready: true, state: 'Ready' },
    });

    IndexHostSingleton._set(pineconeConfig, 'test-index', '');

    // the empty value was not cached so describeIndex should be called
    await IndexHostSingleton.getHostUrl(pineconeConfig, 'test-index');
    expect(mockDescribeIndex).toHaveBeenCalledTimes(1);
  });
});
