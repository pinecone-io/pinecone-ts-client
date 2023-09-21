import type { PineconeConfiguration } from './types';
import {
  Configuration,
  ConfigurationParameters,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { queryParamsStringify, buildUserAgent } from '../utils';
import { ProjectIdSingleton } from './projectIdSingleton';
import fetch from 'cross-fetch';

const basePath = (config: PineconeConfiguration, indexName: string) =>
  `https://${indexName}-${config.projectId}.svc.${config.environment}.pinecone.io`;

export class VectorOperationsProvider {
  private config: PineconeConfiguration;
  private indexName: string;
  private vectorOperations?: VectorOperationsApi;

  constructor(config: PineconeConfiguration, indexName: string) {
    this.config = config;
    this.indexName = indexName;
  }

  async provide() {
    if (this.vectorOperations) {
      return this.vectorOperations;
    }

    if (this.config.projectId) {
      this.vectorOperations = this.buildVectorOperationsConfig(
        this.config,
        this.indexName
      );
    } else {
      this.config.projectId = await ProjectIdSingleton.getProjectId(
        this.config
      );
      this.vectorOperations = this.buildVectorOperationsConfig(
        this.config,
        this.indexName
      );
    }

    return this.vectorOperations;
  }

  buildVectorOperationsConfig(config, indexName) {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: basePath(config, indexName),
      apiKey: config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
      fetchApi: fetch,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    const vectorOperations = new VectorOperationsApi(indexConfiguration);

    return vectorOperations;
  }
}
