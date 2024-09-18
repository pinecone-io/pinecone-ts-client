import type { PineconeConfiguration } from '../data';
import {
  InferenceApi,
  Configuration,
  type ConfigurationParameters as IndexOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../utils';
import { middleware } from '../utils/middleware';

export const inferenceOperationsBuilder = (
  config: PineconeConfiguration
): InferenceApi => {
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
    fetchApi: getFetch(config),
    middleware,
  };

  return new InferenceApi(new Configuration(apiConfig));
};
