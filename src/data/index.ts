import { upsert } from './upsert';
import { fetch } from './fetch';
import { update } from './update';
import { query } from './query';
import { deleteOne } from './deleteOne';
import { deleteMany } from './deleteMany';
import { deleteAll } from './deleteAll';
import { describeIndexStats } from './describeIndexStats';
import { VectorOperationsProvider } from './vectorOperationsProvider';

export type { DeleteManyOptions } from './deleteMany';
export type { DeleteOneOptions } from './deleteOne';
export type { DescribeIndexStatsOptions } from './describeIndexStats';
export type { IdsArray } from './fetch';
export type { UpdateVectorOptions } from './update';
export type { Vector, VectorArray, SparseValues } from './upsert';
export type {
  QueryByVectorId,
  QueryByVectorValues,
  QueryOptions,
} from './query';

export type ApiConfig = {
  projectId?: string;
  apiKey: string;
  environment: string;
};

export class Index {
  private config: ApiConfig;
  private target: {
    index: string;
    namespace: string;
  };

  deleteAll: ReturnType<typeof deleteAll>;
  deleteMany: ReturnType<typeof deleteMany>;
  deleteOne: ReturnType<typeof deleteOne>;
  describeIndexStats: ReturnType<typeof describeIndexStats>;
  fetch: ReturnType<typeof fetch>;
  query: ReturnType<typeof query>;
  update: ReturnType<typeof update>;
  upsert: ReturnType<typeof upsert>;

  constructor(indexName: string, config: ApiConfig, namespace = '') {
    this.config = config;
    this.target = {
      index: indexName,
      namespace: namespace,
    };

    const apiProvider = new VectorOperationsProvider(config, indexName);

    this.deleteAll = deleteAll(apiProvider, namespace);
    this.deleteMany = deleteMany(apiProvider, namespace);
    this.deleteOne = deleteOne(apiProvider, namespace);
    this.describeIndexStats = describeIndexStats(apiProvider);
    this.fetch = fetch(apiProvider, namespace);
    this.update = update(apiProvider, namespace);
    this.upsert = upsert(apiProvider, namespace);
    this.query = query(apiProvider, namespace);
  }

  namespace(namespace: string): Index {
    return new Index(this.target.index, this.config, namespace);
  }
}
