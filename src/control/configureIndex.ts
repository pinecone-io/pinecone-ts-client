import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';
import { ValidateProperties } from '../utils/validateProperties';

// Properties for validation to ensure no unknown/invalid properties are passed, no req'd properties are missing
type ConfigureIndexRequestType = keyof ConfigureIndexRequest;
export const ConfigureIndexRequestProperties: ConfigureIndexRequestType[] = [
  'deletionProtection',
  'spec',
];

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = async (
    indexName: IndexName,
    options: ConfigureIndexRequest
  ) => {
    if (options) {
      ValidateProperties(options, ConfigureIndexRequestProperties);
    }

    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` to configureIndex.'
      );
    }
    // !options.deletionProtection evaluates to false if options.deletionProtection is undefined, empty string, or
    // not provided
    if (!options.spec && !options.deletionProtection) {
      throw new PineconeArgumentError(
        'You must pass either a `spec`, `deletionProtection` or both to configureIndex in order to update.'
      );
    }
    if (options.spec) {
      if (options.spec.pod) {
        ValidateProperties(options.spec.pod, ['replicas', 'podType']);
      }
      if (options.spec.pod && options.spec.pod.replicas) {
        if (options.spec.pod.replicas <= 0) {
          throw new PineconeArgumentError(
            '`replicas` must be a positive integer.'
          );
        }
      }
    }
  };

  return async (
    indexName: IndexName,
    options: ConfigureIndexRequest
  ): Promise<IndexModel> => {
    await validator(indexName, options);

    return await api.configureIndex({
      indexName,
      configureIndexRequest: options,
    });
  };
};
