import type { PineconeConfiguration } from '../../data';
import {
  ManageAssistantsApi as ManageAssistantsDataApi,
  Configuration as DataConfiguration,
  type ConfigurationParameters as AssistantOperationsApiConfigurationParameters,
  X_PINECONE_API_VERSION,
  HTTPHeaders,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import {
  MetricsApi,
  Configuration as EvalConfiguration,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import {
  buildUserAgent,
  getFetch,
  queryParamsStringify,
  normalizeUrl,
} from '../../utils';
import { middleware } from '../../utils/middleware';
import { AssistantHostSingleton } from '../assistantHostSingleton';

export class AsstDataOperationsProvider {
  private readonly config: PineconeConfiguration;
  private readonly asstName: string;
  private asstHostUrl?: string;
  private asstDataOperations?: ManageAssistantsDataApi;
  private metrics?: MetricsApi;
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
      this.asstHostUrl = await AssistantHostSingleton.getHostUrl(
        this.config,
        this.asstName
      );
    }
    return this.asstHostUrl;
  }

  provideMetrics() {
    if (this.metrics) {
      return this.metrics;
    } else {
      this.asstHostUrl = this.getAsstHostByRegion();
      this.metrics = this.buildAssistEvalOperationsConfig();
    }
    return this.metrics;
  }

  getAsstHostByRegion() {
    const { assistantRegion } = this.config;
    let asstHostUrl = 'https://prod-1-data.ke.pinecone.io/assistant';

    // if the region has been specified as 'eu' use that, otherwise default to 'us'
    if (assistantRegion && assistantRegion.toLowerCase() === 'eu') {
      asstHostUrl = 'https://prod-eu-data.ke.pinecone.io/assistant';
    }
    return asstHostUrl;
  }

  buildAsstDataOperationsConfig() {
    const { apiKey } = this.config;
    // Get the host URL from the singleton
    const hostUrl = this.asstHostUrl;
    const headers = this.config.additionalHeaders || null;
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
      middleware,
    };
    console.log('API CONFIG GETTING PASSED THROUGH TO MADA', apiConfig);
    console.log(
      'THIS IS THE FETCH API SPECIFICALLY FOR MADA',
      apiConfig.fetchApi
    );

    return new ManageAssistantsDataApi(new DataConfiguration(apiConfig));
  }

  buildAssistEvalOperationsConfig() {
    const { apiKey } = this.config;

    const hostUrl = this.getAsstHostByRegion();
    const headers = this.config.additionalHeaders || null;
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
      middleware,
    };

    return new MetricsApi(new EvalConfiguration(apiConfig));
  }
}
