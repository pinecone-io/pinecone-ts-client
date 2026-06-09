import {
  DocumentOperationsApi,
  Configuration,
  X_PINECONE_API_VERSION,
  type ConfigurationParameters,
  type HTTPHeaders,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import {
  buildUserAgent,
  getFetch,
  normalizeUrl,
  queryParamsStringify,
} from '../../utils';
import { createMiddlewareArray } from '../../utils/middleware';
import { IndexHostSingleton } from '../../data/indexHostSingleton';
import { PineconeArgumentError } from '../../errors';
import type { PineconeConfiguration } from '../../data';

export class AlphaDocumentOperationsProvider {
  private config: PineconeConfiguration;
  private indexName?: string;
  private indexHostUrl?: string;
  private additionalHeaders?: HTTPHeaders;
  private _api: DocumentOperationsApi | undefined;

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

  async provide(): Promise<DocumentOperationsApi> {
    if (this._api) {
      return this._api;
    }

    if (!this.indexHostUrl) {
      if (!this.indexName) {
        throw new PineconeArgumentError(
          'Either name or host must be provided in IndexOptions',
        );
      }
      this.indexHostUrl = await IndexHostSingleton.getHostUrl(
        this.config,
        this.indexName,
      );
    }

    this._api = this._buildApi();

    return this._api;
  }

  private _buildApi(): DocumentOperationsApi {
    const headers = this.additionalHeaders || null;
    const apiConfig: ConfigurationParameters = {
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
    return new DocumentOperationsApi(new Configuration(apiConfig));
  }
}
