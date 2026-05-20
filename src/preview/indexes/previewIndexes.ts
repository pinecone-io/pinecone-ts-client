import type {
  ManageIndexesApi,
  IndexList,
  IndexModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import type { PineconeConfiguration } from '../../data';
import { alphaIndexOperationsBuilder } from './alphaIndexOperationsBuilder';
import { listPreviewIndexes } from './listIndexes';
import { createPreviewIndex, PreviewCreateIndexOptions } from './createIndex';
import { describePreviewIndex } from './describeIndex';
import { deletePreviewIndex } from './deleteIndex';
import {
  configurePreviewIndex,
  PreviewConfigureIndexOptions,
} from './configureIndex';
import {
  createIndexForModel,
  PreviewCreateIndexForModelOptions,
} from './createIndexForModel';

/**
 * Provides access to alpha control-plane index operations using the 2026-01.alpha API.
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

  /**
   * Creates a schema-based index using the 2026-01.alpha API.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async createIndex(options: PreviewCreateIndexOptions): Promise<IndexModel> {
    return createPreviewIndex(this._api, options);
  }

  /**
   * Describes an index by name using the 2026-01.alpha API.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async describeIndex(indexName: string): Promise<IndexModel> {
    return describePreviewIndex(this._api, indexName);
  }

  /**
   * Deletes an alpha index by name.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
   *
   * Deletion is asynchronous; the index may still be terminating after
   * this call returns. Deletion protection must be disabled before calling
   * this method.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async deleteIndex(name: string): Promise<void> {
    return deletePreviewIndex(this._api, name);
  }

  /**
   * Configures an alpha index by name.
   *
   * Only the fields present in `options` are updated; omit a field to leave it unchanged.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async configureIndex(
    name: string,
    options: PreviewConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configurePreviewIndex(this._api, name, options);
  }

  /**
   * Creates a serverless index pre-configured for a named embedding model using
   * the 2026-01.alpha API.
   *
   * Dimension and similarity metric are derived from the model; supply `cloud`,
   * `region`, `field`, and `model` to get started.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @see [Model-based indexes](https://docs.pinecone.io/guides/index-data/create-an-index)
   * @alpha
   */
  async createIndexForModel(
    options: PreviewCreateIndexForModelOptions,
  ): Promise<IndexModel> {
    return createIndexForModel(this._api, options);
  }
}
