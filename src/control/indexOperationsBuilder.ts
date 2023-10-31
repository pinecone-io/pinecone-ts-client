import {
  IndexOperationsApi,
  Configuration,
} from '../pinecone-generated-ts-fetch';
import { queryParamsStringify, buildUserAgent, getFetch } from '../utils';
import { middleware } from '../utils/middleware';
import type { PineconeConfiguration } from '../data/types';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from '../pinecone-generated-ts-fetch';

export const indexOperationsBuilder = (
  config: PineconeConfiguration
): IndexOperationsApi => {
  const { apiKey } = config;
  const controllerPath = config.controllerHostUrl || 'https://api.pinecone.io';
  const apiConfig: IndexOperationsApiConfigurationParameters = {
    basePath: controllerPath,
    apiKey,
    queryParamsStringify,
    headers: {
      'User-Agent': buildUserAgent(false),
    },
    fetchApi: getFetch(config),
    middleware,
  };

  return new IndexOperationsApi(new Configuration(apiConfig));
};
