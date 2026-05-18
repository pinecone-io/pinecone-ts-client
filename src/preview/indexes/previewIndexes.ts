import type {
  ManageIndexesApi,
  IndexList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import type { PineconeConfiguration } from '../../data';
import { alphaIndexOperationsBuilder } from './alphaIndexOperationsBuilder';
import { listPreviewIndexes } from './listIndexes';

/**
 * Provides access to alpha control-plane index operations using the 202601-alpha API.
 *
 * Access via `pc.preview.indexes`.
 *
 * **Alpha notice:** This class is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export class PreviewIndexes {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = alphaIndexOperationsBuilder(config);
  }

  /**
   * Lists all indexes in the project.
   *
   * **Alpha notice:** Returns `AlphaIndexList` which includes `schema` fields not
   * present in the stable `IndexList`.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async listIndexes(): Promise<IndexList> {
    return listPreviewIndexes(this._api);
  }
}
