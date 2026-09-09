import { decorateIndexModel } from './decorateIndexModel';
import type {
  ManageIndexesApi,
  ConfigureIndexRequest,
  ReadCapacityPatch,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { translateLegacyConfigureOptions } from './legacyTranslation';
import type { CreateIndexReadCapacity } from './legacyTypes';
import type { IndexModel } from './listIndexes';
import type { ReadCapacity, DeletionProtection } from '../types';

/**
 * Options for configuring an index.
 *
 * All fields are optional — send only those you want to change.
 *
 */
export type NativeConfigureIndexOptions = Omit<
  ConfigureIndexRequest,
  'readCapacity' | 'deletionProtection'
> & {
  /**
   * The read capacity configuration to apply. Omit to leave it unchanged.
   */
  readCapacity?: ReadCapacity | ReadCapacityPatch;
  /** Whether to enable deletion protection. Omit to leave it unchanged. */
  deletionProtection?: DeletionProtection;
};

/**
 * Options for the deprecated flat index configuration method.
 * @deprecated Use {@link ConfigureIndexResourceOptions} with {@link Indexes.configure}.
 */
export type ConfigureIndexOptions = Omit<
  NativeConfigureIndexOptions,
  'readCapacity'
> & {
  /** The name of the index to configure. */
  name: string;
  /** @deprecated Use deployment.replicas. */
  podReplicas?: number;
  /** @deprecated Use deployment.podType. */
  podType?: string;
  /** Read capacity in native or legacy flat form. */
  readCapacity?: ReadCapacity | ReadCapacityPatch | CreateIndexReadCapacity;
};
/** Options for {@link Indexes.configure}; pass the index name separately. */
export type ConfigureIndexResourceOptions = Omit<ConfigureIndexOptions, 'name'>;

/** @deprecated Use {@link ConfigureIndexResourceOptions} with deployment. */
export type LegacyConfigureIndexOptions = ConfigureIndexResourceOptions;

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
  options: ConfigureIndexResourceOptions,
): Promise<IndexModel> {
  if (!name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to configure an index.',
    );
  }
  const normalized = translateLegacyConfigureOptions(options);
  const fields: Array<keyof ConfigureIndexResourceOptions> = [
    'deployment',
    'schema',
    'readCapacity',
    'tags',
    'deletionProtection',
  ];
  if (
    !options ||
    !fields.some(
      (field) =>
        normalized[field as keyof NativeConfigureIndexOptions] !== undefined,
    )
  ) {
    throw new PineconeArgumentError(
      'You must pass at least one configuration option to configureIndex.',
    );
  }
  try {
    return decorateIndexModel(
      await api.configureIndex({
        indexName: name,
        configureIndexRequest: normalized,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      }),
    );
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error configuring index ${name}: ${rawMessageText}`,
    );
  }
}
