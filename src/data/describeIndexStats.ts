import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

export type IndexStatsNamespaceSummary = {
  recordCount: number;
};

export type IndexStatsDescription = {
  namespaces?: { [key: string]: IndexStatsNamespaceSummary };
  dimension?: number;
  indexFullness?: number;
  totalRecordCount?: number;
};

const DescribeIndexStatsOptionsSchema = Type.Object(
  {
    filter: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

export type DescribeIndexStatsOptions = Static<
  typeof DescribeIndexStatsOptionsSchema
>;

export const describeIndexStats = (apiProvider: VectorOperationsProvider) => {
  const validator = buildConfigValidator(
    DescribeIndexStatsOptionsSchema,
    'describeIndexStats'
  );

  return async (
    options?: DescribeIndexStatsOptions
  ): Promise<IndexStatsDescription> => {
    if (options) {
      validator(options);
    }

    try {
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
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
