import {
  APIKeysApi,
  Configuration,
  type ConfigurationParameters,
  InvitesApi,
  OrganizationsApi,
  ProjectsApi,
  RoleBindingsApi,
  ServiceAccountsApi,
  UsersApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/admin';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../utils';
import { createMiddlewareArray } from '../utils/middleware';
import { type ResolvedAdminClientConfiguration } from './adminClientConfiguration';
import { TokenProvider } from './tokenProvider';

/**
 * The set of generated Admin API clients, all sharing a single {@link Configuration} (and therefore
 * a single cached OAuth token via the shared {@link TokenProvider}).
 *
 * @internal
 */
export interface AdminApis {
  projects: ProjectsApi;
  organizations: OrganizationsApi;
  apiKeys: APIKeysApi;
  serviceAccounts: ServiceAccountsApi;
  roleBindings: RoleBindingsApi;
  invites: InvitesApi;
  users: UsersApi;
}

/**
 * Builds the generated Admin API clients from a resolved configuration. Supplies an
 * `accessToken` callback (backed by the OAuth2 client-credentials flow).
 *
 * @internal
 */
export const adminOperationsBuilder = (
  config: ResolvedAdminClientConfiguration,
): AdminApis => {
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) || 'https://api.pinecone.io';
  const headers = config.additionalHeaders || null;

  // `buildUserAgent` and `getFetch` read only User-Agent / fetch-related fields, so the admin config
  // can be passed directly — no `apiKey`-shaped adapter is needed. The credential difference (OAuth
  // bearer vs. `apiKey`) is handled below via `accessToken`.
  const tokenProvider = new TokenProvider(
    config.clientId,
    config.clientSecret,
    getFetch(config),
    buildUserAgent(config),
  );

  const apiConfig: ConfigurationParameters = {
    basePath: controllerPath,
    accessToken: () => tokenProvider.getToken(),
    queryParamsStringify,
    headers: {
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      ...headers,
    },
    fetchApi: getFetch(config),
    middleware: createMiddlewareArray(),
  };

  const configuration = new Configuration(apiConfig);

  return {
    projects: new ProjectsApi(configuration),
    organizations: new OrganizationsApi(configuration),
    apiKeys: new APIKeysApi(configuration),
    serviceAccounts: new ServiceAccountsApi(configuration),
    roleBindings: new RoleBindingsApi(configuration),
    invites: new InvitesApi(configuration),
    users: new UsersApi(configuration),
  };
};
