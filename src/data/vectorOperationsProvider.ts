import type { IndexConfiguration, PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { queryParamsStringify, buildUserAgent, getFetch } from '../utils';
import { IndexHostSingleton } from './indexHostSingleton';
import { middleware } from '../utils/middleware';

export class VectorOperationsProvider {
  private config: IndexConfiguration;
  private indexName: string;
  private vectorOperations?: VectorOperationsApi;

  constructor(
    config: PineconeConfiguration,
    indexName: string,
    indexHostUrl?: string
  ) {
    this.config = config;
    this.indexName = indexName;

    // If an indexHostUrl has been passed set it, otherwise keep
    // it undefined so that hostUrl is properly resolved
    if (indexHostUrl) {
      this.config.hostUrl = indexHostUrl;
    }
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    if (this.config.hostUrl) {
      this.vectorOperations = this.buildVectorOperationsConfig(this.config);
    } else {
      this.config.hostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.vectorOperations = this.buildVectorOperationsConfig(this.config);
    }

    return this.vectorOperations;
  }

  buildVectorOperationsConfig(config: IndexConfiguration) {
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
