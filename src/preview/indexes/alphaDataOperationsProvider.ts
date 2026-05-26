import {
  DocumentOperationsApi,
  Configuration,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import type { ConfigurationParameters } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { buildUserAgent, getFetch, queryParamsStringify } from '../../utils';
import { createMiddlewareArray } from '../../utils/middleware';
import { IndexHostSingleton } from '../../data/indexHostSingleton';
import type { PineconeConfiguration } from '../../data';

export class AlphaDocumentOperationsProvider {
  private config: PineconeConfiguration;
  private indexName: string;
  private _api: DocumentOperationsApi | undefined;

  constructor(config: PineconeConfiguration, indexName: string) {
    this.config = config;
    this.indexName = indexName;
  }

  async provide(): Promise<DocumentOperationsApi> {
    if (this._api) {
      return this._api;
    }
    const hostUrl = await IndexHostSingleton.getHostUrl(
      this.config,
      this.indexName,
    );
    const headers = this.config.additionalHeaders || null;
    const apiConfig: ConfigurationParameters = {
      basePath: hostUrl,
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
    this._api = new DocumentOperationsApi(new Configuration(apiConfig));
    return this._api;
  }
}
