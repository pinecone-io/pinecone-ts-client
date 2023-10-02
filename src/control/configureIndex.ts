import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { PineconeArgumentError } from '../errors';
import { buildValidator } from '../validator';
import type { IndexName, PodType } from './types';
import { handleIndexRequestError } from './utils';

import { Type } from '@sinclair/typebox';
import { ReplicasSchema, PodTypeSchema, IndexNameSchema } from './types';

const ConfigureIndexOptionsSchema = Type.Object(
  {
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
  },
  { additionalProperties: false }
);

/**
 * @see [Managing indexes](https://docs.pinecone.io/docs/manage-indexes)
 */
export type ConfigureIndexOptions = {
  /** The number of replicas in the index. The default number of replicas is 1. */
  replicas?: number;

  /** The type of pod in the index. This string should combine a base pod type (`s1`, `p1`, or `p2`) with a size (`x1`, `x2`, `x4`, or `x8`) into a string such as `p1.x1` or `s1.x4`. The default pod type is `p1.x1`. For more information on these, see this guide on [pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes) */
  podType?: PodType;
};

export const configureIndex = (api: IndexOperationsApi) => {
  const indexNameValidator = buildValidator(
    'The first argument to configureIndex',
    IndexNameSchema
  );
  const patchRequestValidator = buildValidator(
    'The second argument to configureIndex',
    ConfigureIndexOptionsSchema
  );

  return async (
    name: IndexName,
    options: ConfigureIndexOptions
  ): Promise<void> => {
    indexNameValidator(name);
    patchRequestValidator(options);

    if (Object.keys(options).length === 0) {
      throw new PineconeArgumentError(
        'The second argument to configureIndex should not be empty object. Please specify at least one propert (replicas, podType) to update.'
      );
    }

    try {
      await api.configureIndex({ indexName: name, patchRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, name);
      throw err;
    }
  };
};
