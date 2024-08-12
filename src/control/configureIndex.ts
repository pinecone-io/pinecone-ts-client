import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = async (
    indexName: IndexName,
    options: ConfigureIndexRequest
  ) => {
    console.log('In validator');
    if (!indexName || indexName.length === 0) {
      console.error('In indexName loop');
      throw new PineconeArgumentError(
        'You must pass a non-empty string for indexName to configureIndex.'
      );
    }
    // !options.deletionProtection evaluates to false if options.deletionProtection is undefined, empty string, or
    // not provided
    if (!options.spec && !options.deletionProtection) {
      console.error('In spec and deletionProtection loop');
      throw new PineconeArgumentError(
        'You must pass either a `spec`, `deletionProtection` or both to configureIndex in order to update.'
      );
    }
    if (options.spec) {
      console.error('In spec loop');
      if (options.spec.pod && options.spec.pod.replicas) {
        if (typeof options.spec.pod.replicas !== 'number') {
          throw new PineconeArgumentError(
            'The second argument to configureIndex had a type error: property' +
              " 'spec/properties/pod/properties/replicas' must be an integer."
          );
        }
        if (options.spec.pod.replicas <= 0) {
          throw new PineconeArgumentError(
            'The second argument to configureIndex had validation errors: property' +
              " 'spec/properties/pod/properties/replicas' must be a positive integer."
          );
        }
      }
      if (options.spec.pod && options.spec.pod.podType) {
        if (typeof options.spec.pod.podType !== 'string') {
          throw new PineconeArgumentError(
            'The second argument to configureIndex had validation errors: property' +
              " 'spec/properties/pod/properties/podType' must be string."
          );
        }
      }
    }
  };

  return async (
    indexName: IndexName,
    options: ConfigureIndexRequest
  ): Promise<IndexModel> => {
    console.log('Before validator');

    await validator(indexName, options);
    console.log('After validator');

    return await api.configureIndex({
      indexName,
      configureIndexRequest: options,
    });
  };
};
