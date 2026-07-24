import type { FetchAPI } from '../pinecone-generated-ts-fetch/admin';
import { X_PINECONE_API_VERSION } from '../pinecone-generated-ts-fetch/admin';
import {
  PineconeAuthorizationError,
  PineconeUnexpectedResponseError,
} from '../errors';

/** The OAuth2 token endpoint used to exchange service-account credentials for a bearer token. */
export const OAUTH_TOKEN_URL = 'https://login.pinecone.io/oauth/token';

/** The audience the minted token is scoped to. Note the trailing slash, which the server requires. */
export const OAUTH_AUDIENCE = 'https://api.pinecone.io/';

/**
 * Refresh the cached token this many milliseconds before it actually expires, so a token is never
 * used right as it lapses (e.g. due to clock skew or in-flight request latency).
 */
const EXPIRY_BUFFER_MS = 60_000;

/** The shape of a successful response from the OAuth token endpoint. */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Obtains and caches an OAuth2 bearer token for the Admin API using the service-account
 * client-credentials flow.
 *
 * The token is fetched lazily on the first call to {@link TokenProvider.getToken}, cached, and
 * automatically refreshed once it is within {@link EXPIRY_BUFFER_MS} of expiring. Concurrent callers
 * during a refresh share a single in-flight request (single-flight) rather than each triggering
 * their own exchange.
 *
 * @internal
 */
export class TokenProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fetchApi: FetchAPI;
  private readonly userAgent: string;

  private token?: string;
  /** Epoch milliseconds at which the cached token expires. */
  private expiresAt = 0;
  /** The in-flight token exchange, if one is currently running (single-flight guard). */
  private inflight?: Promise<string>;

  constructor(
    clientId: string,
    clientSecret: string,
    fetchApi: FetchAPI,
    userAgent: string,
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.fetchApi = fetchApi;
    this.userAgent = userAgent;
  }

  /**
   * Returns a valid bearer token, fetching or refreshing it as needed. Suitable for use directly as
   * the generated `Configuration.accessToken` callback.
   */
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - EXPIRY_BUFFER_MS) {
      return this.token;
    }

    // If a refresh is already running, join it instead of starting another.
    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.fetchToken().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  /** Exchanges the service-account credentials for a fresh token and updates the cache. */
  private async fetchToken(): Promise<string> {
    const response = await this.fetchApi(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
        'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        audience: OAUTH_AUDIENCE,
      }),
    });

    if (!response.ok) {
      throw await this.buildTokenError(response);
    }

    let data: TokenResponse;
    try {
      data = (await response.json()) as TokenResponse;
    } catch {
      throw new PineconeUnexpectedResponseError(
        OAUTH_TOKEN_URL,
        response.status,
        '',
        'Unable to parse the OAuth token response as JSON.',
      );
    }

    if (!data.access_token) {
      throw new PineconeUnexpectedResponseError(
        OAUTH_TOKEN_URL,
        response.status,
        JSON.stringify(data),
        'The OAuth token response did not include an access_token.',
      );
    }

    this.token = data.access_token;
    // `expires_in` is in seconds; fall back to a conservative window if it is missing.
    const expiresInMs = (data.expires_in ?? 0) * 1000;
    this.expiresAt = Date.now() + expiresInMs;

    return this.token;
  }

  /**
   * Builds an informative error from a failed token exchange. The OAuth endpoint returns a body of
   * the form `{ error, error_description }`, which we surface when available.
   */
  private async buildTokenError(response: Response): Promise<Error> {
    let body = '';
    let description: string | undefined;
    try {
      body = await response.text();
      const parsed = JSON.parse(body);
      description = parsed?.error_description || parsed?.error;
    } catch {
      // Non-JSON body; fall back to the raw text captured above.
    }

    // A rejected credential is by far the most common failure and maps cleanly to an auth error,
    // keeping `instanceof PineconeAuthorizationError` working the same as for the data-plane APIs.
    if (response.status === 401 || response.status === 403) {
      return new PineconeAuthorizationError({
        status: response.status,
        url: OAUTH_TOKEN_URL,
      });
    }

    return new PineconeUnexpectedResponseError(
      OAUTH_TOKEN_URL,
      response.status,
      body,
      description || 'The OAuth token exchange failed.',
    );
  }
}
