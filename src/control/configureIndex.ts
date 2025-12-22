import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
  ConfigureIndexOperationRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';
import { RetryOnServerFailure } from '../utils';
import { withControlApiVersion } from './apiVersion';

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
    // TODO - update to handle new configuration properties - serverless, etc
    if (options.spec) {
      const spec = options.spec as NonNullable<ConfigureIndexRequest['spec']>;
      if (spec && 'pod' in spec && spec.pod) {
        ValidateObjectProperties(spec.pod, ['replicas', 'podType']);
        if (spec.pod.replicas && spec.pod.replicas <= 0) {
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

    return await retryWrapper.execute(
      withControlApiVersion<ConfigureIndexOperationRequest>({
        indexName,
        configureIndexRequest: options,
      })
    );
  };
};
