import { Pinecone } from '../../pinecone';
import { indexOperationsBuilder } from '../../control/indexOperationsBuilder';

const credentials = {
  'Api-Key': 'standard-key-placeholder',
  'api-key': 'lowercase-key-placeholder',
  'aPi-KeY': 'mixed-key-placeholder',
  Authorization: 'Bearer standard-auth-placeholder',
  authorization: 'Bearer lowercase-auth-placeholder',
  AUTHORIZATION: 'Bearer uppercase-auth-placeholder',
};
const requestHeaders = { ...credentials, 'X-Request-Source': 'redaction-test' };

describe('ordinary debug credential redaction', () => {
  let originalDebug: string | undefined;
  let originalCurl: string | undefined;
  let debug: jest.SpyInstance;

  beforeEach(() => {
    originalDebug = process.env.PINECONE_DEBUG;
    originalCurl = process.env.PINECONE_DEBUG_CURL;
    process.env.PINECONE_DEBUG = '1';
    delete process.env.PINECONE_DEBUG_CURL;
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalDebug === undefined) delete process.env.PINECONE_DEBUG;
    else process.env.PINECONE_DEBUG = originalDebug;
    if (originalCurl === undefined) delete process.env.PINECONE_DEBUG_CURL;
    else process.env.PINECONE_DEBUG_CURL = originalCurl;
    debug.mockRestore();
  });

  function expectRedactedLogs() {
    const logs = debug.mock.calls.flat().join('\n');
    for (const value of Object.values(credentials)) {
      expect(logs).not.toContain(value);
    }
    expect(logs).toContain('***REDACTED***');
    expect(logs).toContain('redaction-test');
    expect(logs).toContain('GET https://api.pinecone.io/indexes');
    expect(logs).toContain('<<< Body: {"indexes":[]}');
  }

  test('redacts configured credentials through the public client without changing the request', async () => {
    const additionalHeaders = Object.freeze({ ...requestHeaders });
    const fetchApi = jest
      .fn()
      .mockResolvedValue(new Response('{"indexes":[]}'));
    const client = new Pinecone({
      apiKey: credentials['Api-Key'],
      additionalHeaders,
      fetchApi,
    });

    await expect(client.listIndexes()).resolves.toEqual({ indexes: [] });

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi.mock.calls[0][1].headers).toEqual(
      expect.objectContaining(requestHeaders),
    );
    expect(additionalHeaders).toEqual(requestHeaders);
    expectRedactedLogs();
  });

  test.each<[string, () => HeadersInit]>([
    ['record', () => Object.freeze({ ...requestHeaders })],
    ['tuples', () => Object.entries(requestHeaders)],
    ['Headers', () => new Headers(requestHeaders)],
  ])(
    'redacts %s headers passed through request overrides',
    async (_, makeHeaders) => {
      const headers = makeHeaders();
      const before: Record<string, string> = {};
      new Headers(headers).forEach((value, name) => (before[name] = value));
      const fetchApi = jest
        .fn()
        .mockResolvedValue(new Response('{"indexes":[]}'));
      const api = indexOperationsBuilder({
        apiKey: credentials['Api-Key'],
        fetchApi,
      });

      await expect(
        api.listIndexes({ xPineconeApiVersion: '2026-07' }, { headers }),
      ).resolves.toEqual({ indexes: [] });

      expect(fetchApi).toHaveBeenCalledTimes(1);
      const outgoing = fetchApi.mock.calls[0][1].headers;
      expect(outgoing).toBe(headers);
      const after: Record<string, string> = {};
      new Headers(outgoing).forEach((value, name) => (after[name] = value));
      expect(after).toEqual(before);
      expectRedactedLogs();
    },
  );

  test('accepts absent headers through request overrides', async () => {
    const fetchApi = jest
      .fn()
      .mockResolvedValue(new Response('{"indexes":[]}'));
    const api = indexOperationsBuilder({
      apiKey: credentials['Api-Key'],
      fetchApi,
    });
    await expect(
      api.listIndexes(
        { xPineconeApiVersion: '2026-07' },
        { headers: undefined },
      ),
    ).resolves.toEqual({ indexes: [] });
    expect(fetchApi.mock.calls[0][1].headers).toBeUndefined();
    expect(debug.mock.calls.flat().join('\n')).toContain('>>> Headers: {}');
  });
});
