import {ConfigureIndexRequest, IndexModel, ManageIndexesApi,} from '../pinecone-generated-ts-fetch/control';
import {PineconeArgumentError} from '../errors';
// import type { IndexName } from './types';
// import {
//   ReplicasSchema,
//   PodTypeSchema,
//   IndexNameSchema,
//   DeletionProtectionSchema,
// } from './types';

// const ConfigureIndexOptionsSchema = Type.Object(
//   {
//     spec: Type.Optional(
//       Type.Object({
//         pod: Type.Object({
//           replicas: Type.Optional(ReplicasSchema),
//           podType: Type.Optional(PodTypeSchema),
//         }),
//       })
//     ),
//     deletionProtection: Type.Optional(DeletionProtectionSchema),
//   },
//   { additionalProperties: false }
// );

export const configureIndex = (api: ManageIndexesApi) => {
    const indexNameValidator = (indexName: string) => {
      if (indexName.length === 0) {
        throw new PineconeArgumentError(
          'The first argument to configureIndex must be a non-empty string.'
        );
      }
    };
    const patchRequestValidator = (options: ConfigureIndexRequest) => {
        if (Object.keys(options).length === 0) {
            throw new PineconeArgumentError(
                'The second argument to configureIndex cannot be empty object. Please specify at least one property' +
                ' (e.g. spec, deletionProtection) to update.'
            );
        }
    };

    return async (
        indexName: string,
        options: ConfigureIndexRequest
    ): Promise<IndexModel> => {
        indexNameValidator(indexName);
        patchRequestValidator(options);

        return await api.configureIndex({
            indexName,
            configureIndexRequest: options,
        });
    };
};
