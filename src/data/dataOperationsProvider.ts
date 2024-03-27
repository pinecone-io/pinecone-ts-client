import type { PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  DataPlaneApi,
} from '../pinecone-generated-ts-fetch';
import type { HTTPHeaders } from '../pinecone-generated-ts-fetch';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  normalizeUrl,
} from '../utils';
import { IndexHostSingleton } from './indexHostSingleton';
import { middleware } from '../utils/middleware';

export class DataOperationsProvider {
  private config: PineconeConfiguration;
  private indexName: string;
  private indexHostUrl?: string;
  private dataOperations?: DataPlaneApi;
  private additionalHeaders?: HTTPHeaders;

  constructor(
    config: PineconeConfiguration,
    indexName: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders
  ) {
    this.config = config;
    this.indexName = indexName;
    this.indexHostUrl = normalizeUrl(indexHostUrl);
    this.additionalHeaders = additionalHeaders;
  }

  async provide() {
    if (this.dataOperations) {
      return this.dataOperations;
    }

    // If an indexHostUrl has been manually passed we use that,
    // otherwise we rely on resolving the host from the IndexHostSingleton
    if (this.indexHostUrl) {
      this.dataOperations = this.buildDataOperationsConfig();
    } else {
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.dataOperations = this.buildDataOperationsConfig();
    }

    return this.dataOperations;
  }

  buildDataOperationsConfig() {
    const headers = this.additionalHeaders || null;

    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: this.indexHostUrl,
      apiKey: this.config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(this.config),
        ...headers,
      },
      fetchApi: getFetch(this.config),
      middleware,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    const dataOperations = new DataPlaneApi(indexConfiguration);

    return dataOperations;
  }
}
