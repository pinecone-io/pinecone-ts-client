import { indexOperationsBuilder } from '../indexOperationsBuilder';

describe('indexOperationsBuilder', () => {
  test.each([
    [undefined, 'https://api.pinecone.io/indexes'],
    ['controller.example', 'https://controller.example/indexes'],
    ['http://localhost:8080', 'http://localhost:8080/indexes'],
  ])('uses controller %p', async (controllerHostUrl, expectedUrl) => {
    const fetchApi = jest
      .fn()
      .mockResolvedValue(new Response('{"indexes":[]}', { status: 200 }));
    const api = indexOperationsBuilder({
      apiKey: 'test-key',
      controllerHostUrl,
      fetchApi,
    });
    await expect(
      api.listIndexes({ xPineconeApiVersion: '2026-07' }),
    ).resolves.toEqual({ indexes: [] });
    expect(fetchApi).toHaveBeenCalledTimes(1);
    const [url, init] = fetchApi.mock.calls[0];
    expect(url).toBe(expectedUrl);
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual(
      expect.objectContaining({
        'Api-Key': 'test-key',
        'X-Pinecone-Api-Version': '2026-07',
        'User-Agent': expect.stringContaining('@pinecone-database/pinecone'),
      }),
    );
  });

  test('merges additional headers and allows an explicit user-agent override', async () => {
    const fetchApi = jest
      .fn()
      .mockResolvedValue(new Response('{"indexes":[]}', { status: 200 }));
    const api = indexOperationsBuilder({
      apiKey: 'test-key',
      fetchApi,
      additionalHeaders: {
        'X-Request-Source': 'tests',
        'User-Agent': 'custom-agent',
      },
    });
    await api.listIndexes({ xPineconeApiVersion: '2026-07' });
    expect(fetchApi.mock.calls[0][1].headers).toEqual(
      expect.objectContaining({
        'Api-Key': 'test-key',
        'X-Pinecone-Api-Version': '2026-07',
        'X-Request-Source': 'tests',
        'User-Agent': 'custom-agent',
      }),
    );
  });
});
