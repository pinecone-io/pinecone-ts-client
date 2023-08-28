import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const DescribeIndexStatsOptionsSchema = Type.Object(
  {
    filter: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

export type DescribeIndexStatsOptions = Static<
  typeof DescribeIndexStatsOptionsSchema
>;

export const describeIndexStats = (api: VectorOperationsApi) => {
  const validator = buildConfigValidator(
    DescribeIndexStatsOptionsSchema,
    'describeIndexStats'
  );

  return async (options?: DescribeIndexStatsOptions): Promise<object> => {
    if (options) {
      validator(options);
    }

    try {
      const results = await api.describeIndexStats({
        describeIndexStatsRequest: { ...options },
      });
      return results;
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
