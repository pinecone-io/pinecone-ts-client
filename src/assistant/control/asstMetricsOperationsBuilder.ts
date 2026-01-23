import type { PineconeConfiguration } from '../../data';
import {
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
  MetricsApi,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import { buildUserAgent, getFetch, queryParamsStringify } from '../../utils';
import { createMiddlewareArray } from '../../utils/middleware';

export const asstMetricsOperationsBuilder = (
  config: PineconeConfiguration
): MetricsApi => {
  const { apiKey } = config;
  let hostUrl = 'https://prod-1-data.ke.pinecone.io/assistant';
  // If 'eu' is specified use that, otherwise default to 'us'
  if (config.assistantRegion && config.assistantRegion.toLowerCase() === 'eu') {
    hostUrl = 'https://prod-eu-data.ke.pinecone.io/assistant';
  }

  const headers = config.additionalHeaders || null;
  const apiConfig: AssistantOperationsApiConfigurationParameters = {
    basePath: hostUrl,
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

  return new MetricsApi(new Configuration(apiConfig));
};
