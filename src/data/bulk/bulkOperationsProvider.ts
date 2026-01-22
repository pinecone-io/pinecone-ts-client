import type { PineconeConfiguration } from '../vectors/types';
import type { HTTPHeaders } from '../../pinecone-generated-ts-fetch/db_data';
import {
  BulkOperationsApi,
  Configuration,
  ConfigurationParameters,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { IndexHostSingleton } from '../indexHostSingleton';
import { createMiddlewareArray } from '../../utils/middleware';

export class BulkOperationsProvider {
  private readonly config: PineconeConfiguration;
  private readonly indexName?: string;
  private indexHostUrl?: string;
  private bulkOperations?: BulkOperationsApi;
  private readonly additionalHeaders?: HTTPHeaders;

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
    if (this.bulkOperations) {
      return this.bulkOperations;
    }

    // If an indexHostUrl has been manually passed we use that,
    // otherwise we rely on resolving the host from the IndexHostSingleton
    if (this.indexHostUrl) {
      this.bulkOperations = this.buildBulkOperationsConfig();
    } else {
      if (!this.indexName) {
        throw new Error(
          'Either indexName or indexHostUrl must be provided to BulkOperationsProvider'
        );
      }
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName
      );

      this.bulkOperations = this.buildBulkOperationsConfig();
    }

    return this.bulkOperations;
  }

  buildBulkOperationsConfig() {
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
      middleware: createMiddlewareArray(),
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    return new BulkOperationsApi(indexConfiguration);
  }
}
