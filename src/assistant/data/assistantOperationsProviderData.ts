import type { PineconeConfiguration } from '../../data';
import {
  ManageAssistantsApi as ManageAssistantsDataApi,
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { buildUserAgent, getFetch, queryParamsStringify } from '../../utils';
import { middleware } from '../../utils/middleware';
import { AssistantHostSingleton } from '../assistantHostSingleton';

export const assistantDataOperationsBuilder = (
  config: PineconeConfiguration,
  assistantName: string
): ManageAssistantsDataApi => {
  const { apiKey } = config;
  // Get the host URL from the singleton
  const hostUrl = AssistantHostSingleton.getHostUrl(config, assistantName);
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

  return new ManageAssistantsDataApi(new Configuration(apiConfig));
};
