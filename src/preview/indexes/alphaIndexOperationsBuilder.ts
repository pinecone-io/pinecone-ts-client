import {
  ManageIndexesApi,
  Configuration,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import type { ConfigurationParameters } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl,
} from '../../utils';
import { createMiddlewareArray } from '../../utils/middleware';
import type { PineconeConfiguration } from '../../data';

export const alphaIndexOperationsBuilder = (
  config: PineconeConfiguration,
): ManageIndexesApi => {
  const { apiKey } = config;
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) || 'https://api.pinecone.io';
  const headers = config.additionalHeaders || null;
  const apiConfig: ConfigurationParameters = {
    basePath: controllerPath,
    apiKey,
    queryParamsStringify,
    headers: {
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      ...headers,
    },
    fetchApi: getFetch(config),
    middleware: createMiddlewareArray(),
  };

  return new ManageIndexesApi(new Configuration(apiConfig));
};
