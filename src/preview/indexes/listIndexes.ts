import type {
  ManageIndexesApi,
  IndexList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { handleApiError } from '../../errors/handling';

export type {
  IndexList as PreviewIndexList,
  IndexModel as PreviewIndexModel,
  IndexModelStatus as PreviewIndexModelStatus,
  // Response-side sub-types of `PreviewIndexModel` (the `schema` and
  // `readCapacity` fields). These are distinct from the request-side
  // `PreviewCreateIndex*` / `PreviewReadCapacity` types and are what appear on
  // a described/created/configured index.
  IndexSchema as PreviewIndexSchema,
  IndexSchemaField as PreviewIndexSchemaField,
  TypedIndexSchemaField as PreviewTypedIndexSchemaField,
  LegacyMetadataField as PreviewLegacyMetadataField,
  IntegerField as PreviewIntegerField,
  ResponseStringField as PreviewResponseStringField,
  ResponseStringFieldFullTextSearch as PreviewResponseStringFieldFullTextSearch,
  ResponseStringFieldFullTextSearchNgram as PreviewResponseStringFieldFullTextSearchNgram,
  ReadCapacityResponse as PreviewReadCapacityResponse,
  ReadCapacityDedicatedSpecResponse as PreviewReadCapacityDedicatedSpecResponse,
  ReadCapacityOnDemandSpecResponse as PreviewReadCapacityOnDemandSpecResponse,
  ReadCapacityDedicatedConfig as PreviewReadCapacityDedicatedConfig,
  ReadCapacityStatus as PreviewReadCapacityStatus,
  ScalingConfigManual as PreviewScalingConfigManual,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Lists all indexes in the project using the 2026-01.alpha API.
 *
 * @alpha
 */
export async function listPreviewIndexes(
  api: ManageIndexesApi,
): Promise<IndexList> {
  try {
    return await api.listIndexes({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing preview indexes: ${rawMessageText}`,
    );
  }
}
