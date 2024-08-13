import { DataOperationsProvider } from './dataOperationsProvider';
import { PineconeArgumentError } from '../errors';

/**
 * A count of the number of records found inside a namespace
 */
export type IndexStatsNamespaceSummary = {
  /** The number of records in the namespace. */
  recordCount: number;
};

/**
 * An index description returned from { @link Index.describeIndexStats }
 */
export type IndexStatsDescription = {
  /**
   * A map whose keys are the names of namespaces and whose values
   * are a namespace summary including the total record count in that
   * namespace.
   *
   * @see [Using namespaces](https://docs.pinecone.io/docs/namespaces)
   */
  namespaces?: { [key: string]: IndexStatsNamespaceSummary };

  /** The dimension of the index. */
  dimension?: number;

  /**
   * A number indicating the percentage of available storage consumed
   * by your index.
   *
   * @see [Manage indexes](https://docs.pinecone.io/docs/manage-indexes)
   * @see [Choosing index type and size](https://docs.pinecone.io/docs/choosing-index-type-and-size)
   */
  indexFullness?: number;

  /**
   * The total number of records that have been upserted to your index.
   */
  totalRecordCount?: number;
};

/**
 * Optionally specify a filter expression to limit results from
 * {@link Index.describeIndexStats}.
 */
export type DescribeIndexStatsOptions = {
  /**
   * @see [Metadata filtering](https://docs.pinecone.io/docs/metadata-filtering)
   */
  filter: object;
};

export const describeIndexStats = (apiProvider: DataOperationsProvider) => {
  const validator = async (options: DescribeIndexStatsOptions) => {
    const map = options['filter'];
    for (const key in map) {
      if (!map[key]) {
        throw new PineconeArgumentError('Filter cannot be empty');
      }
    }
  };

  return async (
    options?: DescribeIndexStatsOptions
  ): Promise<IndexStatsDescription> => {
    if (options) {
      await validator(options);
    }

    const api = await apiProvider.provide();
    const results = await api.describeIndexStats({
      describeIndexStatsRequest: { ...options },
    });

    const mappedResult = {
      namespaces: {},
      dimension: results.dimension,
      indexFullness: results.indexFullness,
      totalRecordCount: results.totalVectorCount,
    };
    if (results.namespaces) {
      for (const key in results.namespaces) {
        mappedResult.namespaces[key] = {
          recordCount: results.namespaces[key].vectorCount,
        };
      }
    }

    return mappedResult;
  };
};
