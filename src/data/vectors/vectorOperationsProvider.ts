import type { PineconeConfiguration } from './types';
import type { HTTPHeaders } from '../../pinecone-generated-ts-fetch/db_data';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { IndexHostSingleton } from '../indexHostSingleton';
import { middleware } from '../../utils/middleware';

export class VectorOperationsProvider {
  private config: PineconeConfiguration;
  private indexName?: string;
  private indexHostUrl?: string;
  private vectorOperations?: VectorOperationsApi;
  private additionalHeaders?: HTTPHeaders;

  constructor(
    config: PineconeConfiguration,
    indexName?: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders
  ) {
    this.config = config;
    this.indexName = indexName;
    this.indexHostUrl = normalizeUrl(indexHostUrl);
    this.additionalHeaders = additionalHeaders;
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    // If an indexHostUrl has been manually passed we use that,
    // otherwise we rely on resolving the host from the IndexHostSingleton
    if (this.indexHostUrl) {
      this.vectorOperations = this.buildDataOperationsConfig();
    } else {
      if (!this.indexName) {
        throw new Error(
          'Either indexName or indexHostUrl must be provided to VectorOperationsProvider'
        );
      }
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.vectorOperations = this.buildDataOperationsConfig();
    }

    return this.vectorOperations;
  }

  async provideHostUrl() {
    if (this.indexHostUrl) {
      return this.indexHostUrl;
    } else {
      if (!this.indexName) {
        throw new Error(
          'Either indexName or indexHostUrl must be provided to VectorOperationsProvider'
        );
      }
      return await IndexHostSingleton.getHostUrl(this.config, this.indexName);
    }
  }

  buildDataOperationsConfig() {
    const headers = this.additionalHeaders || null;

    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: this.indexHostUrl,
      apiKey: this.config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(this.config),
        'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
        ...headers,
      },
      fetchApi: getFetch(this.config),
      middleware,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    return new VectorOperationsApi(indexConfiguration);
  }
}
