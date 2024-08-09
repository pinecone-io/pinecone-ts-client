import {CollectionModel, CreateCollectionRequest, ManageIndexesApi,} from '../pinecone-generated-ts-fetch/control';
import {PineconeArgumentError} from "../errors";

export const createCollection = (api: ManageIndexesApi) => {
    const createCollectionsValidator = (options: CreateCollectionRequest) => {
        // Check if options is provided, if it's an object, and if it's not an array
        if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).length === 0) {
            throw new PineconeArgumentError(
                'The argument passed to createCollection must be a non-empty object.'
            );
        }

        // Confirm req'd fields are present
        const requiredFields = ['name', 'source'];
        for (const field of requiredFields) {
            if (!options[field] || options[field].length === 0 || typeof options[field] !== 'string') {
                throw new PineconeArgumentError(
                    `You must enter a non-empty string for the \`${field}\` field.`
                );
            }
        }

        // Confirm there aren't extraneous fields
        const optionKeys = Object.keys(options);
        const extraneousFields = optionKeys.filter(key => !requiredFields.includes(key));
        if (extraneousFields.length > 0) {
            throw new PineconeArgumentError(
                `Extraneous fields are not allowed: ${extraneousFields.join(', ')}`
            );
        }
    };

    return async (options: CreateCollectionRequest): Promise<CollectionModel> => {
        createCollectionsValidator(options);

        return await api.createCollection({createCollectionRequest: options});
    };
};
