import type {
  ManageIndexesApi,
  BackupScheduleResponse,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { BackupScheduleFrequency } from '../types';

/**
 * The configuration and status of a backup schedule.
 *
 * `nextScheduledRun` is `null` while the schedule is disabled; re-enabling it
 * recomputes the next run from the moment of the update.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface BackupScheduleModel extends Omit<
  BackupScheduleResponse,
  'frequency'
> {
  /** How often the schedule runs. */
  frequency: BackupScheduleFrequency | (string & {});
}

/**
 * Retrieves the configuration and status of a backup schedule.
 *
 * @param api - The manage-indexes API client.
 * @param scheduleId - The ID of the schedule to describe.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function describeBackupSchedule(
  api: ManageIndexesApi,
  scheduleId: string,
): Promise<BackupScheduleModel> {
  if (!scheduleId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `scheduleId` in order to describe a backup schedule.',
    );
  }
  try {
    return await api.describeBackupSchedule({
      scheduleId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error describing backup schedule ${scheduleId}: ${rawMessageText}`,
    );
  }
}
