import { UpsertCommand } from './upsert';
import { FetchCommand } from './fetch';
import type { FetchOptions } from './fetch';
import { UpdateCommand } from './update';
import type { UpdateOptions } from './update';
import { QueryCommand } from './query';
import type { QueryOptions } from './query';
import { deleteOne } from './deleteOne';
import { deleteMany } from './deleteMany';
import { deleteAll } from './deleteAll';
import { describeIndexStats } from './describeIndexStats';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import type {
  PineconeConfiguration,
  RecordMetadata,
  PineconeRecord,
} from './types';

export type {
  PineconeConfiguration,
  PineconeRecord,
  RecordId,
  RecordSparseValues,
  RecordValues,
  RecordMetadata,
  RecordMetadataValue,
} from './types';
export { PineconeConfigurationSchema } from './types';
export type { DeleteManyOptions } from './deleteMany';
export type { DeleteOneOptions } from './deleteOne';
export type {
  DescribeIndexStatsOptions,
  IndexStatsDescription,
  IndexStatsNamespaceSummary,
} from './describeIndexStats';
export type { FetchOptions, FetchResponse } from './fetch';
export type { UpdateOptions } from './update';
export type {
  ScoredPineconeRecord,
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
} from './query';

export class Index<T extends RecordMetadata = RecordMetadata> {
  private config: PineconeConfiguration;
  private target: {
    index: string;
    namespace: string;
  };

  deleteAll: ReturnType<typeof deleteAll>;
  deleteMany: ReturnType<typeof deleteMany>;
  deleteOne: ReturnType<typeof deleteOne>;
  describeIndexStats: ReturnType<typeof describeIndexStats>;

  private _fetchCommand: FetchCommand<T>;
  private _queryCommand: QueryCommand<T>;
  private _updateCommand: UpdateCommand<T>;
  private _upsertCommand: UpsertCommand<T>;

  constructor(
    indexName: string,
    config: PineconeConfiguration,
    namespace = ''
  ) {
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

    this._fetchCommand = new FetchCommand<T>(apiProvider, namespace);
    this._queryCommand = new QueryCommand<T>(apiProvider, namespace);
    this._updateCommand = new UpdateCommand<T>(apiProvider, namespace);
    this._upsertCommand = new UpsertCommand<T>(apiProvider, namespace);
  }

  namespace(namespace: string): Index<T> {
    return new Index<T>(this.target.index, this.config, namespace);
  }

  async upsert(data: Array<PineconeRecord<T>>) {
    return await this._upsertCommand.run(data);
  }

  async fetch(options: FetchOptions) {
    return await this._fetchCommand.run(options);
  }

  async query(options: QueryOptions) {
    return await this._queryCommand.run(options);
  }

  async update(options: UpdateOptions<T>) {
    return await this._updateCommand.run(options);
  }
}
