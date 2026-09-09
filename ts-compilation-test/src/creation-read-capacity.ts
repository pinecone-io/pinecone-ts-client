import {
  Pinecone,
  CreateIndexReadCapacity,
  CreateIndexForModelOptions,
  CreateIndexFromBackupOptions,
  ReadCapacity,
} from '@pinecone-database/pinecone';

// Compile-only fixture; importing this module does not make API requests.
export function compileOnlyCreationReadCapacity() {
  const pc = new Pinecone({ apiKey: 'test' });
  const capacities: (CreateIndexReadCapacity | ReadCapacity)[] = [
    {},
    { mode: 'OnDemand' },
    { nodeType: 'b1', manual: { replicas: 1, shards: 1 } },
    { mode: 'Dedicated', nodeType: 't1', manual: { replicas: 0, shards: 2 } },
    {
      mode: 'Dedicated',
      dedicated: {
        nodeType: 'b1',
        scaling: 'FutureScaling',
        manual: { replicas: 1, shards: 1 },
      },
    },
  ];

  for (const readCapacity of capacities) {
    const model: CreateIndexForModelOptions = {
      name: 'model-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: { model: 'multilingual-e5-large', fieldMap: { text: 'text' } },
      readCapacity,
    };
    const backup: CreateIndexFromBackupOptions = {
      name: 'restored-index',
      readCapacity,
    };
    void pc.createIndexForModel(model);
    void pc.indexes.createForModel(model);
    void pc.createIndexFromBackup({ backupId: 'backup', ...backup });
    void pc.backups.createIndex('backup', backup);
  }
}
