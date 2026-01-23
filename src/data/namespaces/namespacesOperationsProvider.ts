import type { PineconeConfiguration } from '../vectors/types';
import type { HTTPHeaders } from '../../pinecone-generated-ts-fetch/db_data';
import {
  Configuration,
  ConfigurationParameters,
  NamespaceOperationsApi,
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

export class NamespaceOperationsProvider {
  private readonly config: PineconeConfiguration;
  private readonly indexName?: string;
  private indexHostUrl?: string;
  private namespaceOperations?: NamespaceOperationsApi;
  private readonly additionalHeaders?: HTTPHeaders;

  constructor(
    config: PineconeConfiguration,
    indexName?: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ) {
    this.config = config;
    this.indexName = indexName;
    this.indexHostUrl = normalizeUrl(indexHostUrl);
    this.additionalHeaders = additionalHeaders;
  }

  async provide() {
    if (this.namespaceOperations) {
      return this.namespaceOperations;
    }

    // If an indexHostUrl has been manually passed we use that,
    // otherwise we rely on resolving the host from the IndexHostSingleton
    if (this.indexHostUrl) {
      this.namespaceOperations = this.buildNamespaceOperationsConfig();
    } else {
      if (!this.indexName) {
        throw new Error(
          'Either indexName or indexHostUrl must be provided to NamespaceOperationsProvider',
        );
      }
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName,
      );

      this.namespaceOperations = this.buildNamespaceOperationsConfig();
    }

    return this.namespaceOperations;
  }

  buildNamespaceOperationsConfig() {
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
    return new NamespaceOperationsApi(indexConfiguration);
  }
}
