import type { PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import type { Pinecone } from '../pinecone';
import {
  queryParamsStringify,
  buildUserAgent,
  getFetch,
  middleware,
} from '../utils';
import { DataUrlSingleton } from './dataUrlSingleton';

export class VectorOperationsProvider {
  private controlPlaneClient: Pinecone;
  private config: PineconeConfiguration;
  private indexName: string;
  private vectorOperations?: VectorOperationsApi;

  constructor(client: Pinecone, indexName: string) {
    this.controlPlaneClient = client;
    this.config = client.getConfig();
    this.indexName = indexName;
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    const dataUrl = await DataUrlSingleton.getDataUrl(
      this.controlPlaneClient,
      this.indexName
    );
    this.vectorOperations = this.buildVectorOperationsConfig(
      this.config,
      dataUrl
    );

    return this.vectorOperations;
  }

  buildVectorOperationsConfig(config, dataUrl) {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: dataUrl,
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
