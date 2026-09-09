import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { BackupScheduleModel } from './describeBackupSchedule';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { BackupScheduleFrequency } from '../types';

/**
 * Options for creating a backup schedule on an index.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface CreateBackupScheduleOptions {
  /**
   * Name for the schedule. Each run names its backup after the schedule plus
   * the run timestamp, so keep it short.
   */
  name: string;
  /** How often the schedule runs. */
  frequency: BackupScheduleFrequency;
  /** Number of days to keep each backup the schedule produces. */
  retentionDays: number;
}

/**
 * Creates a time-based backup schedule for an index.
 *
 * @param api - The manage-indexes API client.
 * @param indexName - Name of the index to attach the schedule to.
 * @param options - Schedule name, cadence, and retention.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function createBackupSchedule(
  api: ManageIndexesApi,
  indexName: string,
  options: CreateBackupScheduleOptions,
): Promise<BackupScheduleModel> {
  if (!indexName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `indexName` in order to create a backup schedule.',
    );
  }
  if (!options || !options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create a backup schedule.',
    );
  }
  try {
    return await api.createBackupSchedule({
      indexName,
      createBackupScheduleRequest: {
        name: options.name,
        schedule: { type: 'time-based', frequency: options.frequency },
        retention: { expireAfterDays: options.retentionDays },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating backup schedule for index ${indexName}: ${rawMessageText}`,
    );
  }
}
