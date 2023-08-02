import type { ConfigurationParameters } from '../pinecone-generated-ts-fetch';
import {
  Configuration,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { upsert } from './upsert';
import { fetch } from './fetch';

type ApiConfig = {
  projectId: string;
  apiKey: string;
  environment: string;
};

export class Index {
  private config: ApiConfig;
  private target: {
    index: string;
    namespace: string;
  };

  upsert: ReturnType<typeof upsert>;
  fetch: ReturnType<typeof fetch>;

  constructor(indexName: string, config: ApiConfig, namespace = '') {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: `https://${indexName}-${config.projectId}.svc.${config.environment}.pinecone.io`,
      apiKey: config.apiKey,
    };

    const indexConfiguration = new Configuration(indexConfigurationParameters);
    const vectorOperations = new VectorOperationsApi(indexConfiguration);
    this.config = config;
    this.target = {
      index: indexName,
      namespace: namespace,
    };

    this.upsert = upsert(vectorOperations, namespace);
    this.fetch = fetch(vectorOperations, namespace);
  }

  namespace(namespace: string): Index {
    return new Index(this.target.index, this.config, namespace);
  }
}
