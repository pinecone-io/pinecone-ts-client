import type { PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { queryParamsStringify, buildUserAgent, getFetch } from '../utils';
import { HostUrlSingleton } from './hostUrlSingleton';
import { middleware } from '../utils/middleware';

export class VectorOperationsProvider {
  private config: PineconeConfiguration;
  private indexName: string;
  private vectorOperations?: VectorOperationsApi;

  constructor(config: PineconeConfiguration, indexName: string) {
    this.config = config;
    this.indexName = indexName;
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    if (this.config.hostUrl) {
      this.vectorOperations = this.buildVectorOperationsConfig(this.config);
    } else {
      this.config.hostUrl = await HostUrlSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.vectorOperations = this.buildVectorOperationsConfig(this.config);
    }

    return this.vectorOperations;
  }

  buildVectorOperationsConfig(config) {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: config.hostUrl,
      apiKey: config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
      fetchApi: getFetch(config),
      middleware,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    const vectorOperations = new VectorOperationsApi(indexConfiguration);

    return vectorOperations;
  }
}
