import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';
import { RetryOnServerFailure } from '../utils';

// Properties for validation to ensure no unknown/invalid properties are passed
type ConfigureIndexRequestType = keyof ConfigureIndexRequest;
export const ConfigureIndexRequestProperties: ConfigureIndexRequestType[] = [
  'deletionProtection',
  'spec',
  'tags',
  'embed',
];

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = (indexName: IndexName, options: ConfigureIndexRequest) => {
    if (options) {
      ValidateObjectProperties(options, ConfigureIndexRequestProperties);
    }

    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` to configureIndex.'
      );
    }
    // !options.deletionProtection evaluates to false if options.deletionProtection is undefined, empty string, or
    // not provided
    if (
      !options.spec &&
      !options.deletionProtection &&
      !options.tags &&
      !options.embed
    ) {
      throw new PineconeArgumentError(
        'You must pass either `spec`, `deletionProtection`, `tags`, or `embed` to configureIndex in order to update.'
      );
    }
    if (options.spec) {
      if (options.spec.pod) {
        ValidateObjectProperties(options.spec.pod, ['replicas', 'podType']);
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
    options: ConfigureIndexRequest,
    maxRetries?: number
  ): Promise<IndexModel> => {
    validator(indexName, options);

    const retryWrapper = new RetryOnServerFailure(
      api.configureIndex.bind(api),
      maxRetries
    );

    return await retryWrapper.execute({
      indexName,
      configureIndexRequest: options,
    });
  };
};
