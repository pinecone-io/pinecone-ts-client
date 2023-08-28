import type { ConfigurationParameters } from '../pinecone-generated-ts-fetch';
import {
  Configuration,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { upsert } from './upsert';
import { fetch } from './fetch';
import { update } from './update';
import { queryParamsStringify, buildUserAgent } from '../utils';
import { deleteVector } from './delete';
import { describeIndexStats } from './describeIndexStats';

export type { DescribeIndexStatsOptions } from './describeIndexStats';

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
  delete: ReturnType<typeof deleteVector>;
  describeIndexStats: ReturnType<typeof describeIndexStats>;
  update: ReturnType<typeof update>;

  constructor(indexName: string, config: ApiConfig, namespace = '') {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: `https://${indexName}-${config.projectId}.svc.${config.environment}.pinecone.io`,
      apiKey: config.apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
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
    this.delete = deleteVector(vectorOperations, namespace);
    this.describeIndexStats = describeIndexStats(vectorOperations);
    this.update = update(vectorOperations, namespace);
  }

  namespace(namespace: string): Index {
    return new Index(this.target.index, this.config, namespace);
  }
}
