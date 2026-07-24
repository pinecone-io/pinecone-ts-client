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
 * The token is fetched lazily on the first call to {@link TokenProvider.getToken} and cached for the
 * lifetime of the owning {@link AdminClient} — one exchange per client, mirroring the Python and Go
 * SDKs. There is no proactive refresh, so an `AdminClient` kept alive past the token's server-side
 * expiry (~30 minutes) will need to be recreated; admin operations are expected to run within a
 * time-bounded session. Concurrent callers during the initial exchange share a single in-flight
 * request (single-flight) rather than each triggering their own.
 *
 * @internal
 */
export class TokenProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fetchApi: FetchAPI;
  private readonly userAgent: string;

  private token?: string;
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
   * Returns the bearer token, performing the credential exchange on first use and returning the
   * cached value thereafter. Suitable for use directly as the generated `Configuration.accessToken`
   * callback.
   */
  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    // If the initial exchange is already running, join it instead of starting another.
    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.fetchToken().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  /** Exchanges the service-account credentials for a token and caches it. */
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
    // The default Api-Key wording does not apply here, so we pass admin-specific wording that also
    // surfaces the server's `error_description` when present.
    if (response.status === 401 || response.status === 403) {
      const detail = description ? ` (${description})` : '';
      return new PineconeAuthorizationError(
        { status: response.status, url: OAUTH_TOKEN_URL },
        `The clientId and clientSecret you provided were rejected during the OAuth token exchange` +
          `${detail}. Please check your service account credentials and try again. You can manage` +
          ` service accounts in the Pinecone console at https://app.pinecone.io.`,
      );
    }

    return new PineconeUnexpectedResponseError(
      OAUTH_TOKEN_URL,
      response.status,
      body,
      description || 'The OAuth token exchange failed.',
    );
  }
}
