import type { PineconeConfiguration } from '../../data';
import {
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
  MetricsApi,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import { buildUserAgent, getFetch, queryParamsStringify } from '../../utils';
import { middleware } from '../../utils/middleware';
import { AssistantHostSingleton } from '../assistantHostSingleton';

export const assistantEvalOperationsBuilder = (
  config: PineconeConfiguration
): MetricsApi => {
  const { apiKey } = config;
  // All calls to eval will have 'eval' as assistantName
  const hostUrl = AssistantHostSingleton.getHostUrl(config, 'eval');
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
    middleware,
  };

  return new MetricsApi(new Configuration(apiConfig));
};
