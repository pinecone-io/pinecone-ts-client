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
import {
  type ResolvedAdminClientConfiguration,
  toPineconeConfigShim,
} from './adminClientConfiguration';
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
 * Builds the generated Admin API clients from a resolved configuration. Mirrors
 * {@link inferenceOperationsBuilder}, but supplies an `accessToken` callback (backed by the OAuth2
 * client-credentials flow) instead of the `apiKey` used by the data-plane clients.
 *
 * @internal
 */
export const adminOperationsBuilder = (
  config: ResolvedAdminClientConfiguration,
): AdminApis => {
  const shim = toPineconeConfigShim(config);
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) || 'https://api.pinecone.io';
  const headers = config.additionalHeaders || null;

  const tokenProvider = new TokenProvider(
    config.clientId,
    config.clientSecret,
    getFetch(shim),
    buildUserAgent(shim),
  );

  const apiConfig: ConfigurationParameters = {
    basePath: controllerPath,
    accessToken: () => tokenProvider.getToken(),
    queryParamsStringify,
    headers: {
      'User-Agent': buildUserAgent(shim),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      ...headers,
    },
    fetchApi: getFetch(shim),
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
