import {
  OAUTH_AUDIENCE,
  OAUTH_TOKEN_URL,
  TokenProvider,
} from '../tokenProvider';
import {
  PineconeAuthorizationError,
  PineconeUnexpectedResponseError,
} from '../../errors';

type FetchMock = jest.Mock<
  Promise<Response>,
  [RequestInfo | URL, RequestInit?]
>;

const makeResponse = (
  body: object | string,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
): Response =>
  ({
    ok,
    status,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }) as unknown as Response;

const tokenBody = (accessToken: string, expiresIn = 1800) => ({
  access_token: accessToken,
  token_type: 'Bearer',
  expires_in: expiresIn,
});

describe('TokenProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('exchanges client credentials at the OAuth endpoint with the expected payload', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValue(makeResponse(tokenBody('tok-abc')));
    const provider = new TokenProvider(
      'my-client-id',
      'my-client-secret',
      fetchMock as unknown as typeof fetch,
      'test-user-agent',
    );

    const token = await provider.getToken();

    expect(token).toBe('tok-abc');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(OAUTH_TOKEN_URL);
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      client_id: 'my-client-id',
      client_secret: 'my-client-secret',
      grant_type: 'client_credentials',
      audience: OAUTH_AUDIENCE,
    });
  });

  test('caches the token and does not re-fetch while it is still valid', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValue(makeResponse(tokenBody('tok-cached')));
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    const first = await provider.getToken();
    const second = await provider.getToken();

    expect(first).toBe('tok-cached');
    expect(second).toBe('tok-cached');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('refreshes the token once it is within the expiry buffer', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValueOnce(makeResponse(tokenBody('tok-1', 1800)))
      .mockResolvedValueOnce(makeResponse(tokenBody('tok-2', 1800)));
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    const nowSpy = jest.spyOn(Date, 'now');

    // t=0: first fetch, token valid for 1800s.
    nowSpy.mockReturnValue(0);
    expect(await provider.getToken()).toBe('tok-1');

    // t=1700s: within the 60s buffer of the 1800s expiry -> refresh.
    nowSpy.mockReturnValue(1_750_000);
    expect(await provider.getToken()).toBe('tok-2');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('coalesces concurrent refreshes into a single request (single-flight)', async () => {
    let resolveFetch: (r: Response) => void = () => {};
    const fetchMock: FetchMock = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    const p1 = provider.getToken();
    const p2 = provider.getToken();
    resolveFetch(makeResponse(tokenBody('tok-shared')));

    expect(await p1).toBe('tok-shared');
    expect(await p2).toBe('tok-shared');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('throws PineconeAuthorizationError when credentials are rejected (401)', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          { error: 'access_denied', error_description: 'bad creds' },
          { ok: false, status: 401 },
        ),
      );
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    await expect(provider.getToken()).rejects.toThrow(
      PineconeAuthorizationError,
    );
  });

  test('throws PineconeUnexpectedResponseError on other non-2xx statuses', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          { error: 'server_error', error_description: 'boom' },
          { ok: false, status: 500 },
        ),
      );
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    await expect(provider.getToken()).rejects.toThrow(
      PineconeUnexpectedResponseError,
    );
  });

  test('throws when the response is missing an access_token', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValue(
        makeResponse({ token_type: 'Bearer', expires_in: 1800 }),
      );
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    await expect(provider.getToken()).rejects.toThrow(
      PineconeUnexpectedResponseError,
    );
  });

  test('a failed exchange clears the in-flight guard so a later call can retry', async () => {
    const fetchMock: FetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ error: 'server_error' }, { ok: false, status: 500 }),
      )
      .mockResolvedValueOnce(makeResponse(tokenBody('tok-recovered')));
    const provider = new TokenProvider(
      'id',
      'secret',
      fetchMock as unknown as typeof fetch,
      'ua',
    );

    await expect(provider.getToken()).rejects.toThrow();
    expect(await provider.getToken()).toBe('tok-recovered');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
