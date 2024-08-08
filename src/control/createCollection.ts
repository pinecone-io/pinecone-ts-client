import {CollectionModel, CreateCollectionRequest, ManageIndexesApi,} from '../pinecone-generated-ts-fetch/control';
import {PineconeArgumentError} from "../errors";
// import { buildConfigValidator } from '../validator';
// import { CollectionNameSchema, IndexNameSchema } from './types';
// import { Type } from '@sinclair/typebox';

// const CreateCollectionOptionsSchema = Type.Object(
//   {
//     name: CollectionNameSchema,
//     source: IndexNameSchema,
//   },
//   { additionalProperties: false }
// );

export const createCollection = (api: ManageIndexesApi) => {
    const createCollectionsValidator = (options: CreateCollectionRequest) => {
        if (!options.name || options.name.length === 0) {
            throw new PineconeArgumentError(
                'You must enter a non-empty string for `name` field.'
            );
        }
        if (!options.source || options.source.length === 0) {
            throw new PineconeArgumentError(
                'You must enter a non-empty string for `source` field.'
            );
        }
    };

    return async (options: CreateCollectionRequest): Promise<CollectionModel> => {
        createCollectionsValidator(options);
        return await api.createCollection({createCollectionRequest: options});
    };
};
