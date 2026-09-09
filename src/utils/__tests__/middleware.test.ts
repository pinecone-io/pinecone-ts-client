import { createMiddlewareArray } from '../middleware';
import { indexOperationsBuilder } from '../../control/indexOperationsBuilder';
import {
  PineconeAuthorizationError,
  PineconeBadRequestError,
  PineconeConnectionError,
  PineconeMaxRetriesExceededError,
} from '../../errors';

const url = 'https://api.pinecone.io/indexes';
const init = { method: 'GET' };

describe('shared request middleware', () => {
  let originalDebug: string | undefined;
  let originalCurl: string | undefined;
  let debug: jest.SpyInstance;

  beforeEach(() => {
    originalDebug = process.env.PINECONE_DEBUG;
    originalCurl = process.env.PINECONE_DEBUG_CURL;
    delete process.env.PINECONE_DEBUG;
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

  test('installs path safety and error handling when debug flags are absent', () => {
    expect(createMiddlewareArray()).toHaveLength(2);
  });

  test('preserves the exact retry-exhaustion error', async () => {
    const error = new PineconeMaxRetriesExceededError(3);
    await expect(
      createMiddlewareArray()[1].onError!({
        error,
        url,
        init,
        fetch: jest.fn(),
      }),
    ).rejects.toBe(error);
  });

  test('wraps transport failures and retains their cause', async () => {
    const error = new TypeError('connection refused');
    const result = createMiddlewareArray()[1].onError!({
      error,
      url,
      init,
      fetch: jest.fn(),
    });
    await expect(result).rejects.toBeInstanceOf(PineconeConnectionError);
    await expect(result).rejects.toHaveProperty('cause', error);
  });

  test.each([200, 201, 202, 204, 299])(
    'returns status %s without consuming its body',
    async (status) => {
      const response = new Response(status === 204 ? null : 'body', { status });
      expect(
        await createMiddlewareArray()[1].post!({
          response,
          url,
          init,
          fetch: jest.fn(),
        }),
      ).toBe(response);
      expect(response.bodyUsed).toBe(false);
    },
  );

  test('maps a plain-text authorization error using the request URL', async () => {
    const result = createMiddlewareArray()[1].post!({
      response: new Response('Invalid API key', { status: 401 }),
      url,
      init,
      fetch: jest.fn(),
    });
    await expect(result).rejects.toBeInstanceOf(PineconeAuthorizationError);
    await expect(result).rejects.toHaveProperty(
      'message',
      expect.stringContaining(url),
    );
  });

  test.each([false, true])(
    'decodes nested API errors through the generated runtime with debug=%s',
    async (enabled) => {
      if (enabled) process.env.PINECONE_DEBUG = '1';
      const response = new Response(
        JSON.stringify({
          status: 400,
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Invalid schema',
            details: { field: 'embedding' },
          },
        }),
        { status: 400 },
      );
      const api = indexOperationsBuilder({
        apiKey: 'test-key',
        fetchApi: jest.fn().mockResolvedValue(response),
      });
      const result = api.listIndexes({ xPineconeApiVersion: '2026-07' });
      await expect(result).rejects.toBeInstanceOf(PineconeBadRequestError);
      await expect(result).rejects.toHaveProperty('message', 'Invalid schema');
      // The runtime gives each post hook a fresh clone. Debug logging must not
      // prevent the following error middleware from reading the same payload.
      if (enabled)
        expect(debug).toHaveBeenCalledWith(
          expect.stringContaining('Invalid schema'),
        );
      else expect(debug).not.toHaveBeenCalled();
    },
  );

  test('debug logging preserves successful decoding and redacts the API key', async () => {
    process.env.PINECONE_DEBUG = '1';
    const api = indexOperationsBuilder({
      apiKey: 'test-secret-api-key',
      fetchApi: jest.fn().mockResolvedValue(new Response('{"indexes":[]}')),
    });
    await expect(
      api.listIndexes({ xPineconeApiVersion: '2026-07' }),
    ).resolves.toEqual({ indexes: [] });
    const logs = debug.mock.calls.flat().join('\n');
    expect(logs).toContain('GET https://api.pinecone.io/indexes');
    expect(logs).toContain('***REDACTED***');
    expect(logs).not.toContain('test-secret-api-key');
    expect(logs).toContain('<<< Body: {"indexes":[]}');
  });

  test('logs a request body and the opt-in curl command in middleware order', async () => {
    process.env.PINECONE_DEBUG = '1';
    process.env.PINECONE_DEBUG_CURL = '1';
    const middleware = createMiddlewareArray();
    expect(middleware).toHaveLength(4);
    const request = {
      url,
      fetch: jest.fn(),
      init: {
        method: 'POST',
        headers: {
          'Api-Key': 'test-curl-key',
          'Content-Type': 'application/json',
        },
        body: '{"name":"test"}',
      },
    };
    await middleware[1].pre!(request);
    await middleware[2].post!({ ...request, response: new Response('{}') });
    const logs = debug.mock.calls.flat().join('\n');
    expect(logs).toContain('>>> Body: {"name":"test"}');
    expect(logs).toContain(
      'curl -X POST https://api.pinecone.io/indexes -H "Api-Key: test-curl-key" -H "Content-Type: application/json" -d \'{"name":"test"}\'',
    );
    expect(logs.indexOf('>>> Body:')).toBeLessThan(logs.indexOf('curl -X'));
  });
});

describe('additional header content-type protection', () => {
  test.each([
    { 'Content-Type': 'application/json' },
    [['content-type', 'application/json']],
    new Headers({ 'Content-Type': 'application/json' }),
  ] as RequestInit['headers'][])(
    'preserves encoding for header container %p',
    async (headers) => {
      const middleware = createMiddlewareArray({
        'Content-Type': 'text/plain',
        'content-type': 'text/html',
        'CONTENT-TYPE': 'application/xml',
        'X-Custom': 'retained',
      });
      const result = await middleware[1].pre!({
        url,
        init: { headers },
        fetch: jest.fn(),
      });
      expect(new Headers(result!.init.headers).get('content-type')).toBe(
        'application/json',
      );
      expect(new Headers(result!.init.headers).get('x-custom')).toBe(
        'retained',
      );
    },
  );
});
