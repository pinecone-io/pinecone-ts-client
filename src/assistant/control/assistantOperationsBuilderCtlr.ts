import type { PineconeConfiguration } from '../../data';
import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  Configuration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { middleware } from '../../utils/middleware';

export const assistantControlOperationsBuilder = (
  config: PineconeConfiguration
): ManageAssistantsControlApi => {
  const { apiKey } = config;
  const controllerPath =
    normalizeUrl(config.controllerHostUrl) ||
    'https://api.pinecone.io/assistant';
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
  process.env.PINECONE_DEBUG = 'true';
  return new ManageAssistantsControlApi(new Configuration(apiConfig));
};
