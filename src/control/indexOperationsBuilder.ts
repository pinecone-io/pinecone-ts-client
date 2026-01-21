import {
  ManageIndexesApi,
  Configuration,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl,
} from '../utils';
import { createMiddlewareArray } from '../utils/middleware';
import type { PineconeConfiguration } from '../data/vectors/types';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from '../pinecone-generated-ts-fetch/db_control';

export const indexOperationsBuilder = (
  config: PineconeConfiguration
): ManageIndexesApi => {
  const { apiKey, maxRetries } = config;
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) || 'https://api.pinecone.io';
  const headers = config.additionalHeaders || null;
  const apiConfig: IndexOperationsApiConfigurationParameters = {
    basePath: controllerPath,
    apiKey,
    queryParamsStringify,
    headers: {
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      ...headers,
    },
    fetchApi: getFetch(config),
    middleware: createMiddlewareArray({ maxRetries }),
  };

  return new ManageIndexesApi(new Configuration(apiConfig));
};
