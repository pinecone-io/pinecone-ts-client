import type {
  ManageIndexesApi,
  UpdateBackupScheduleRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import type { BackupScheduleModel } from './describeBackupSchedule';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { BackupScheduleFrequency } from '../types';

/**
 * Options for updating a backup schedule. Omitted fields are left unchanged.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface UpdateBackupScheduleOptions {
  /** New cadence for the schedule. */
  frequency?: BackupScheduleFrequency;
  /**
   * New retention window in days. Also re-times the expiry of backups the
   * schedule has already produced.
   */
  retentionDays?: number;
  /**
   * `false` pauses the schedule and clears `nextScheduledRun`. `true` on a
   * paused schedule runs a backup right away and recomputes the next run
   * from now.
   */
  enabled?: boolean;
}

/**
 * Updates the cadence, retention, or enabled state of a backup schedule.
 *
 * @param api - The manage-indexes API client.
 * @param scheduleId - The ID of the schedule to update.
 * @param options - The fields to change.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function updateBackupSchedule(
  api: ManageIndexesApi,
  scheduleId: string,
  options: UpdateBackupScheduleOptions = {},
): Promise<BackupScheduleModel> {
  if (!scheduleId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `scheduleId` in order to update a backup schedule.',
    );
  }
  const updateBackupScheduleRequest: UpdateBackupScheduleRequest = {};
  if (options.frequency !== undefined) {
    updateBackupScheduleRequest.frequency = options.frequency;
  }
  if (options.retentionDays !== undefined) {
    updateBackupScheduleRequest.retention = {
      expireAfterDays: options.retentionDays,
    };
  }
  if (options.enabled !== undefined) {
    updateBackupScheduleRequest.enabled = options.enabled;
  }
  try {
    return await api.updateBackupSchedule({
      scheduleId,
      updateBackupScheduleRequest,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error updating backup schedule ${scheduleId}: ${rawMessageText}`,
    );
  }
}
