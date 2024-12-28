import type { PineconeConfiguration } from '../../data';
import {
  ManageAssistantsApi as ManageAssistantsDataApi,
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { middleware } from '../../utils/middleware';

// Notes:
// - `ConfigurationParameters` and `Configuration` are the same in runtime.ts across both data plane and control plane
// APIs for Assistant

export const assistantDataOperationsBuilder = (
  config: PineconeConfiguration
): ManageAssistantsDataApi => {
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

  return new ManageAssistantsDataApi(new Configuration(apiConfig));
};