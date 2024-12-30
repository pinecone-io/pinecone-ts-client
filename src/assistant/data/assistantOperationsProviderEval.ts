import type { PineconeConfiguration } from '../../data';
import {
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
  MetricsApi,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { middleware } from '../../utils/middleware';

export const assistantEvalOperationsBuilder = (
  config: PineconeConfiguration
): MetricsApi => {
  const { apiKey } = config;
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) ||
    'https://prod-1-data.ke.pinecone.io/assistant';
  const headers = config.additionalHeaders || null;
  const apiConfig: AssistantOperationsApiConfigurationParameters = {
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

  return new MetricsApi(new Configuration(apiConfig));
};
