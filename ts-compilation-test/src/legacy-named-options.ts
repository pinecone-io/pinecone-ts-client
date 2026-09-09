import { Pinecone } from '@pinecone-database/pinecone';
import type {
  CreateBackupOptions,
  CreateBackupResourceOptions,
  CreateIndexFromBackupOptions,
  CreateIndexFromBackupResourceOptions,
  ConfigureIndexOptions,
  ConfigureIndexResourceOptions,
  DescribeBackupOptions,
  DeleteBackupOptions,
  DescribeRestoreJobOptions,
  DeleteIndexOptions,
  DescribeIndexOptions,
  DeleteCollectionOptions,
  DescribeCollectionOptions,
  ListBackupsOptions,
  ReadCapacityOnDemandParams,
  ReadCapacityDedicatedParams,
  CreateIndexReadCapacity,
} from '@pinecone-database/pinecone';

// Compile-only consumer contract: importing this file must not make API calls.
export function compileOnlyLegacyNamedOptions(pc: Pinecone) {
  const backup: CreateBackupOptions = { indexName: 'my-index', name: 'backup' };
  const restore: CreateIndexFromBackupOptions = {
    backupId: 'backup-id',
    name: 'restored',
  };
  const configure: ConfigureIndexOptions = {
    name: 'my-index',
    deletionProtection: 'enabled',
  };
  pc.createBackup(backup);
  pc.createIndexFromBackup(restore);
  pc.configureIndex(configure);

  const backupResource: CreateBackupResourceOptions = { name: 'backup' };
  const restoreResource: CreateIndexFromBackupResourceOptions = {
    name: 'restored',
  };
  const configureResource: ConfigureIndexResourceOptions = {
    deletionProtection: 'enabled',
  };
  pc.backups.create('my-index', backupResource);
  pc.backups.create('my-index');
  pc.backups.createIndex('backup-id', restoreResource);
  pc.indexes.configure('my-index', configureResource);

  // @ts-expect-error The flat backup contract requires indexName.
  const missingBackupIndex: CreateBackupOptions = { name: 'backup' };
  // @ts-expect-error The flat restore contract requires backupId.
  const missingRestoreId: CreateIndexFromBackupOptions = { name: 'restored' };
  // @ts-expect-error The flat configuration contract requires name.
  const missingConfigureName: ConfigureIndexOptions = {
    deletionProtection: 'enabled',
  };
  // @ts-expect-error Resource options cannot be passed to a flat backup call.
  pc.createBackup(backupResource);
  // @ts-expect-error Resource options cannot be passed to a flat restore call.
  pc.createIndexFromBackup(restoreResource);
  // @ts-expect-error Resource options cannot be passed to a flat configure call.
  pc.configureIndex(configureResource);
  // @ts-expect-error The new index name remains required by the resource method.
  pc.backups.createIndex('backup-id', {});
  void [missingBackupIndex, missingRestoreId, missingConfigureName];

  const describeBackup: DescribeBackupOptions = 'backup-id';
  const deleteBackup: DeleteBackupOptions = 'backup-id';
  const describeRestore: DescribeRestoreJobOptions = 'restore-job-id';
  const deleteIndex: DeleteIndexOptions = 'my-index';
  const describeIndex: DescribeIndexOptions = 'my-index';
  const deleteCollection: DeleteCollectionOptions = 'my-collection';
  const describeCollection: DescribeCollectionOptions = 'my-collection';
  const list: ListBackupsOptions = {
    indexName: 'my-index',
    limit: 10,
    paginationToken: 'next',
    includeDeleted: true,
  };
  pc.describeBackup(describeBackup);
  pc.deleteBackup(deleteBackup);
  pc.describeRestoreJob(describeRestore);
  pc.deleteIndex(deleteIndex);
  pc.describeIndex(describeIndex);
  pc.deleteCollection(deleteCollection);
  pc.describeCollection(describeCollection);
  pc.listBackups(list);
  pc.listBackups({});

  const onDemand: ReadCapacityOnDemandParams = {};
  const dedicated: ReadCapacityDedicatedParams = {
    nodeType: 'b1',
    manual: { replicas: 1, shards: 1 },
  };
  const capacities: CreateIndexReadCapacity[] = [onDemand, dedicated];
  pc.configureIndex({ name: 'my-index', readCapacity: dedicated });
  pc.indexes.configure('my-index', { readCapacity: onDemand });
  // @ts-expect-error Dedicated capacity must supply manual scaling.
  const incompleteDedicated: ReadCapacityDedicatedParams = { nodeType: 'b1' };
  // @ts-expect-error On-demand mode cannot be dedicated.
  const wrongMode: ReadCapacityOnDemandParams = { mode: 'Dedicated' };
  void [capacities, incompleteDedicated, wrongMode];
}
