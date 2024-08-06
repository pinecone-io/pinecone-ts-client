import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';
import { buildValidator } from '../validator';
import type { IndexName } from './types';

import { Type } from '@sinclair/typebox';
import {
  ReplicasSchema,
  PodTypeSchema,
  IndexNameSchema,
  DeletionProtectionSchema,
} from './types';

const ConfigureIndexOptionsSchema = Type.Object(
  {
    spec: Type.Optional(
      Type.Object({
        pod: Type.Object({
          replicas: Type.Optional(ReplicasSchema),
          podType: Type.Optional(PodTypeSchema),
        }),
      }),
    ),
    deletionProtection: Type.Optional(DeletionProtectionSchema),
  },
  { additionalProperties: false },
);

export const configureIndex = (api: ManageIndexesApi) => {
  const indexNameValidator = buildValidator(
    'The first argument to configureIndex',
    IndexNameSchema,
  );
  const patchRequestValidator = buildValidator(
    'The second argument to configureIndex',
    ConfigureIndexOptionsSchema,
  );

  return async (
    indexName: IndexName,
    options: ConfigureIndexRequest,
  ): Promise<IndexModel> => {
    indexNameValidator(indexName);
    patchRequestValidator(options);

    if (Object.keys(options).length === 0) {
      throw new PineconeArgumentError(
        'The second argument to configureIndex should not be empty object. Please specify at least one property (spec, deletionProtection) to update.',
      );
    }

    return await api.configureIndex({
      indexName,
      configureIndexRequest: options,
    });
  };
};
