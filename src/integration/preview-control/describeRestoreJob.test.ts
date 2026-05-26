import { Pinecone } from '../../index';
import { PineconeNotFoundError } from '../../errors';

describe('preview describeRestoreJob', () => {
  let pc: Pinecone;

  beforeAll(() => {
    pc = new Pinecone();
  });

  test('returns RestoreJobModel for an existing restore job if one exists', async () => {
    const result = await pc.preview.indexes.listRestoreJobs({ limit: 1 });
    if (result.data.length > 0) {
      const described = await pc.preview.indexes.describeRestoreJob(
        result.data[0].restore_job_id,
      );
      expect(described.restore_job_id).toBeDefined();
      expect(described.backup_id).toBeDefined();
      expect(described.status).toBeDefined();
      expect(described.target_index_name).toBeDefined();
    } else {
      console.log('No restore jobs found, skipping describe assertion');
    }
  });

  test('throws PineconeNotFoundError for a non-existent job_id', async () => {
    await expect(
      pc.preview.indexes.describeRestoreJob('nonexistent-job-id-xyz'),
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
