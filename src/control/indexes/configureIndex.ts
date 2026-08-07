import type {
  ManageIndexesApi,
  ConfigureIndexRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { IndexModel } from './listIndexes';
import type { ReadCapacity, DeletionProtection } from '../types';

/**
 * Options for configuring an index.
 *
 * All fields are optional — send only those you want to change.
 *
 */
export type ConfigureIndexOptions = Omit<
  ConfigureIndexRequest,
  'readCapacity' | 'deletionProtection'
> & {
  /**
   * The read capacity configuration to apply. Omit to leave it unchanged.
   */
  readCapacity?: ReadCapacity;
  /** Whether to enable deletion protection. Omit to leave it unchanged. */
  deletionProtection?: DeletionProtection;
};

export type {
  PatchIndexDeploymentRequest,
  PatchIndexSchema,
  PatchSemanticTextField,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Configures an index.
 *
 * Only the fields present in `options` are updated; omit a field to leave it unchanged.
 *
 */
export async function configureIndex(
  api: ManageIndexesApi,
  name: string,
  options: ConfigureIndexOptions,
): Promise<IndexModel> {
  if (!name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to configure an index.',
    );
  }
  try {
    return await api.configureIndex({
      indexName: name,
      configureIndexRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error configuring index ${name}: ${rawMessageText}`,
    );
  }
}
