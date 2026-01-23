import type { PineconeConfiguration } from '../../data';
import {
  ManageAssistantsApi as ManageAssistantsDataApi,
  Configuration as DataConfiguration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
  HTTPHeaders,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import {
  buildUserAgent,
  getFetch,
  queryParamsStringify,
  normalizeUrl,
} from '../../utils';
import { createMiddlewareArray } from '../../utils/middleware';
import { AssistantHostSingleton } from '../assistantHostSingleton';

export class AsstDataOperationsProvider {
  private readonly config: PineconeConfiguration;
  private readonly asstName: string;
  private asstHostUrl?: string;
  private asstDataOperations?: ManageAssistantsDataApi;
  private additionalHeaders?: HTTPHeaders;

  constructor(
    config: PineconeConfiguration,
    asstName: string,
    asstHostUrl?: string,
    additionalHeaders?: HTTPHeaders
  ) {
    this.config = config;
    this.asstName = asstName;
    this.asstHostUrl = normalizeUrl(asstHostUrl);
    this.additionalHeaders = additionalHeaders;
  }

  async provideData() {
    if (this.asstDataOperations) {
      return this.asstDataOperations;
    }

    // If a host url has been manually passed we use that,
    // otherwise we rely on resolving the host from the AssistantHostSingleton
    if (this.asstHostUrl) {
      this.asstDataOperations = this.buildAsstDataOperationsConfig();
    } else {
      this.asstHostUrl = await AssistantHostSingleton.getHostUrl(
        this.config,
        this.asstName
      );
      this.asstDataOperations = this.buildAsstDataOperationsConfig();
    }

    return this.asstDataOperations;
  }

  async provideHostUrl() {
    if (this.asstHostUrl) {
      return this.asstHostUrl;
    } else {
      return await AssistantHostSingleton.getHostUrl(
        this.config,
        this.asstName
      );
    }
  }

  buildAsstDataOperationsConfig() {
    const { apiKey } = this.config;
    const hostUrl = this.asstHostUrl;
    const headers = this.additionalHeaders || null;
    const apiConfig: AssistantOperationsApiConfigurationParameters = {
      basePath: hostUrl,
      apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(this.config),
        'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
        ...headers,
      },
      fetchApi: getFetch(this.config),
      middleware: createMiddlewareArray(),
    };

    return new ManageAssistantsDataApi(new DataConfiguration(apiConfig));
  }
}
