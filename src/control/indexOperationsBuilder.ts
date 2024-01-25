import {
  ManageIndexesApi,
  Configuration,
} from '../pinecone-generated-ts-fetch';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl,
} from '../utils';
import { middleware } from '../utils/middleware';
import type { PineconeConfiguration } from '../data/types';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from '../pinecone-generated-ts-fetch';

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
      ...headers,
    },
    fetchApi: getFetch(config),
    middleware,
  };

  return new ManageIndexesApi(new Configuration(apiConfig));
};
