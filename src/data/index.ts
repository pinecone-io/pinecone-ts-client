import type { ConfigurationParameters } from '../pinecone-generated-ts-fetch';
import {
  Configuration,
  VectorOperationsApi,
} from '../pinecone-generated-ts-fetch';
import { upsert } from './upsert';
import { fetch } from './fetch';
import { update } from './update';
import { query } from './query';
import { queryParamsStringify, buildUserAgent } from '../utils';
import { deleteVector } from './delete';
import { deleteOne } from './deleteOne';
import { deleteMany } from './deleteMany';
import { deleteAll } from './deleteAll';
import { describeIndexStats } from './describeIndexStats';

export type { DescribeIndexStatsOptions } from './describeIndexStats';

export type { IdsArray } from './fetch';
export type { DeleteVectorOptions } from './delete';
export type { UpdateVectorOptions } from './update';
export type { Vector, VectorArray, SparseValues } from './upsert';
export type {
  QueryOptions,
  QueryByVectorId,
  QueryByVectorValues,
} from './query';

type ApiConfig = {
  projectId: string;
  apiKey: string;
  environment: string;
};

const basePath = (config: ApiConfig, indexName: string) =>
  `https://${indexName}-${config.projectId}.svc.${config.environment}.pinecone.io`;

export class Index {
  private config: ApiConfig;
  private target: {
    index: string;
    namespace: string;
  };

  delete: ReturnType<typeof deleteVector>;
  deleteAll: ReturnType<typeof deleteAll>;
  deleteMany: ReturnType<typeof deleteMany>;
  deleteOne: ReturnType<typeof deleteOne>;
  describeIndexStats: ReturnType<typeof describeIndexStats>;
  fetch: ReturnType<typeof fetch>;
  query: ReturnType<typeof query>;
  update: ReturnType<typeof update>;
  upsert: ReturnType<typeof upsert>;

  constructor(indexName: string, config: ApiConfig, namespace = '') {
    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: basePath(config, indexName),
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

    this.delete = deleteVector(vectorOperations, namespace);
    this.deleteAll = deleteAll(vectorOperations, namespace);
    this.deleteMany = deleteMany(vectorOperations, namespace);
    this.deleteOne = deleteOne(vectorOperations, namespace);
    this.describeIndexStats = describeIndexStats(vectorOperations);
    this.fetch = fetch(vectorOperations, namespace);
    this.query = query(vectorOperations, namespace);
    this.update = update(vectorOperations, namespace);
    this.upsert = upsert(vectorOperations, namespace);
  }

  namespace(namespace: string): Index {
    return new Index(this.target.index, this.config, namespace);
  }
}
