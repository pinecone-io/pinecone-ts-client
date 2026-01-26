import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

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
   * If this parameter is present, the operation only returns statistics for vectors that satisfy the filter.
   *
   * @see [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata)
   */
  filter: object;
};

export const describeIndexStats = (apiProvider: VectorOperationsProvider) => {
  const validator = (options: DescribeIndexStatsOptions) => {
    const map = options['filter'];
    for (const key in map) {
      if (!map[key]) {
        throw new PineconeArgumentError(
          `\`filter\` property cannot be empty for ${key}`,
        );
      }
    }
  };

  return async (
    options?: DescribeIndexStatsOptions,
  ): Promise<IndexStatsDescription> => {
    if (options) {
      validator(options);
    }

    const api = await apiProvider.provide();
    const results = await api.describeIndexStats({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
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
