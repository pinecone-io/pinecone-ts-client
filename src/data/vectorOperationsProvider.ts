import type { PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl,
} from '../utils';
import { IndexHostSingleton } from './indexHostSingleton';
import { middleware } from '../utils/middleware';

export class VectorOperationsProvider {
  private config: PineconeConfiguration;
  private indexName: string;
  private indexHostUrl?: string;
  private vectorOperations?: VectorOperationsApi;

  constructor(
    config: PineconeConfiguration,
    indexName: string,
    indexHostUrl?: string
  ) {
    this.config = config;
    this.indexName = indexName;
    this.indexHostUrl = normalizeUrl(indexHostUrl);
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    // If an indexHostUrl has been manually passed we use that,
    // otherwise we rely on resolving the host from the IndexHostSingleton
    if (this.indexHostUrl) {
      this.vectorOperations = this.buildVectorOperationsConfig();
    } else {
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.vectorOperations = this.buildVectorOperationsConfig();
    }

    return this.vectorOperations;
  }

  buildVectorOperationsConfig() {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: this.indexHostUrl,
      apiKey: this.config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
      fetchApi: getFetch(this.config),
      middleware,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    const vectorOperations = new VectorOperationsApi(indexConfiguration);

    return vectorOperations;
  }
}
