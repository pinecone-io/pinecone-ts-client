import {
  ManageIndexesApi,
  Configuration,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/control';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl, FetchAPI2,
} from '../utils';
import { middleware } from '../utils/middleware';
import type { PineconeConfiguration } from '../data/types';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from '../pinecone-generated-ts-fetch/control';


export const indexOperationsBuilder = (
  config: PineconeConfiguration
): ManageIndexesApi => {
  const { apiKey } = config;
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
    fetchApi: getFetch(config) as FetchAPI2,
    middleware,
  };

  return new ManageIndexesApi(new Configuration(apiConfig));
};
