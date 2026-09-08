import { Pinecone } from '@pinecone-database/pinecone';

// Compiled against the packed SDK by the TypeScript compatibility CI matrix.
// These assignments enforce both the public arguments and return types without
// making network calls. Keep the old API available alongside the resources.
export function legacyControlPlane(pc: Pinecone) {
  const methods: {
    createIndex: Pinecone['indexes']['create'];
    createIndexForModel: Pinecone['indexes']['createForModel'];
    describeIndex: Pinecone['indexes']['describe'];
    listIndexes: Pinecone['indexes']['list'];
    deleteIndex: Pinecone['indexes']['delete'];
    configureIndex: (
      options: { name: string } & Parameters<
        Pinecone['indexes']['configure']
      >[1],
    ) => ReturnType<Pinecone['indexes']['configure']>;
    createCollection: Pinecone['collections']['create'];
    describeCollection: Pinecone['collections']['describe'];
    listCollections: Pinecone['collections']['list'];
    deleteCollection: Pinecone['collections']['delete'];
    createBackup: (
      options: { indexName: string } & Parameters<
        Pinecone['backups']['create']
      >[1],
    ) => ReturnType<Pinecone['backups']['create']>;
    describeBackup: Pinecone['backups']['describe'];
    listBackups: (
      options?: Parameters<Pinecone['backups']['listByIndex']>[1] & {
        indexName?: string;
      },
    ) => ReturnType<Pinecone['backups']['list']>;
    deleteBackup: Pinecone['backups']['delete'];
    createIndexFromBackup: (
      options: { backupId: string } & Parameters<
        Pinecone['backups']['createIndex']
      >[1],
    ) => ReturnType<Pinecone['backups']['createIndex']>;
    describeRestoreJob: Pinecone['restoreJobs']['describe'];
    listRestoreJobs: Pinecone['restoreJobs']['list'];
    createAssistant: Pinecone['assistants']['create'];
    describeAssistant: Pinecone['assistants']['describe'];
    listAssistants: Pinecone['assistants']['list'];
    updateAssistant: Pinecone['assistants']['update'];
    deleteAssistant: Pinecone['assistants']['delete'];
    evaluate: Pinecone['assistants']['evaluate'];
  } = pc;

  // Exercise legacy argument shapes that differ from the resources.
  pc.createBackup({ indexName: 'index', name: 'backup' });
  pc.createIndexFromBackup({ backupId: 'backup', name: 'restored' });
  pc.configureIndex({ name: 'index', deletionProtection: 'enabled' });
  pc.listBackups();
  pc.listBackups({ limit: 10, paginationToken: 'next' });
  pc.listBackups({
    indexName: 'index',
    limit: 10,
    paginationToken: 'next',
    includeDeleted: true,
  });

  // @ts-expect-error legacy configure still requires the index name
  pc.configureIndex({ deletionProtection: 'enabled' });
  // @ts-expect-error legacy listBackups uses an options object
  pc.listBackups('index');
  // @ts-expect-error restored methods preserve typed response models
  const wrongResponse: Promise<string> = pc.describeIndex('index');
  void wrongResponse;
  return methods;
}
