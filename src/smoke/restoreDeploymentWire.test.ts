import { Pinecone } from '../index';

const CONTROL_PLANE = 'https://api.test.pinecone.io';
const BACKUP_ID = '11450b9f-96e5-47e5-9186-03f346b1f385';

const restoreClient = (fetchApi: jest.Mock) =>
  new Pinecone({
    apiKey: 'mock-restore-key',
    controllerHostUrl: CONTROL_PLANE,
    fetchApi,
    maxRetries: 0,
  });

const accepted = () =>
  new Response(
    JSON.stringify({ restore_job_id: 'job-1', index_id: 'index-1' }),
    { status: 202, headers: { 'Content-Type': 'application/json' } },
  );

const sentBody = (transport: jest.Mock) =>
  JSON.parse(transport.mock.calls[0][1].body);

describe('restore deployment wire contract', () => {
  test.each([
    [
      'managed',
      { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' } as const,
      { deployment_type: 'managed', cloud: 'aws', region: 'us-west-2' },
    ],
    [
      'byoc',
      { deploymentType: 'byoc', environment: 'aws-us-east-1-b921' } as const,
      { deployment_type: 'byoc', environment: 'aws-us-east-1-b921' },
    ],
  ])(
    'createIndex sends a %s deployment',
    async (_, deployment, wireDeployment) => {
      const transport = jest.fn().mockResolvedValue(accepted());
      const result = await restoreClient(transport).backups.createIndex(
        BACKUP_ID,
        { name: 'restored', deployment },
      );

      expect(transport.mock.calls[0][0]).toBe(
        `${CONTROL_PLANE}/backups/${BACKUP_ID}/create-index`,
      );
      expect(sentBody(transport)).toEqual({
        name: 'restored',
        deployment: wireDeployment,
      });
      expect(result).toEqual({ restoreJobId: 'job-1', indexId: 'index-1' });
    },
  );

  test('createIndex leaves deployment out when it is not set', async () => {
    const transport = jest.fn().mockResolvedValue(accepted());
    await restoreClient(transport).backups.createIndex(BACKUP_ID, {
      name: 'restored',
    });

    expect(sentBody(transport)).not.toHaveProperty('deployment');
  });
});
