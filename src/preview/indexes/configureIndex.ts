import type {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for configuring an alpha index using the 2026-01.alpha API.
 *
 * All fields are optional — send only those you want to change.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export type PreviewConfigureIndexOptions = ConfigureIndexRequest;

/**
 * Configures an alpha index using the 2026-01.alpha API.
 *
 * Only the fields present in `options` are updated; omit a field to leave it unchanged.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward
 * compatibility guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export async function configurePreviewIndex(
  api: ManageIndexesApi,
  name: string,
  options: PreviewConfigureIndexOptions,
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
        `Error configuring preview index ${name}: ${rawMessageText}`,
    );
  }
}
