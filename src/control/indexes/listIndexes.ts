import type {
  ManageIndexesApi,
  IndexList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { handleApiError } from '../../errors/handling';

export type {
  IndexList,
  IndexModel,
  IndexModelStatus,
  // Response-side sub-types of `IndexModel` (the `schema` and
  // `readCapacity` fields). These are distinct from the request-side
  // `CreateIndex*` / `ReadCapacity` types and are what appear on
  // a described/created/configured index.
  IndexSchema,
  IndexSchemaField,
  TypedIndexSchemaField,
  LegacyMetadataField,
  IntegerField,
  ResponseStringField,
  ResponseStringFieldFullTextSearch,
  ResponseStringFieldFullTextSearchNgram,
  ReadCapacityResponse,
  ReadCapacityDedicatedSpecResponse,
  ReadCapacityOnDemandSpecResponse,
  ReadCapacityDedicatedConfig,
  ReadCapacityStatus,
  ScalingConfigManual,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Lists all indexes in the project.
 *
 */
export async function listIndexes(api: ManageIndexesApi): Promise<IndexList> {
  try {
    return await api.listIndexes({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) => `Error listing indexes: ${rawMessageText}`,
    );
  }
}
