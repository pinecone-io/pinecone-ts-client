import {
  Pinecone,
  Index,
  IndexModel,
  CreateIndexOptions,
  DocumentRecord,
  SearchDocumentsOptions,
  SearchDocumentsResponse,
  FetchDocumentsResponse,
  NamespaceDescription,
  BackupModel,
  BackupList,
  CreateIndexFromBackupResponse,
  RestoreJobModel,
  CollectionModel,
  CollectionList,
  QueryResponse,
  PineconeRecord,
  AssistantModel,
  AssistantList,
  ModelInfoList,
} from '@pinecone-database/pinecone';

// Never invoked or imported by the executable sample. These calls compile
// against the installed package in every consumer TypeScript matrix leg.
export async function compileResourceSurface(pc: Pinecone): Promise<void> {
  const options = {
    name: 'documents',
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-west-2',
    },
    schema: {
      fields: {
        embedding: { type: 'dense_vector', dimension: 2, metric: 'cosine' },
      },
    },
  } satisfies CreateIndexOptions;
  const created: IndexModel = await pc.indexes.create(options);
  const described: IndexModel = await pc.indexes.describe(created.name);
  await pc.indexes.configure(created.name, { deletionProtection: 'enabled' });
  await pc.indexes.list();
  await pc.indexes.delete(created.name);

  const index: Index<{ category: string }> = pc
    .index<{ category: string }>('documents')
    .namespace('tenant');
  const documents: DocumentRecord[] = [
    { _id: 'doc', fields: { embedding: [1, 0], category: 'books' } },
  ];
  await index.upsertDocuments({ documents });
  const search: SearchDocumentsOptions = {
    topK: 3,
    scoreBy: [{ type: 'dense_vector', fields: ['embedding'], values: [1, 0] }],
  };
  const matches: SearchDocumentsResponse = await index.searchDocuments(search);
  const fetched: FetchDocumentsResponse = await index.fetchDocuments({
    ids: ['doc'],
  });
  await index.listDocuments({ limit: 10 });
  await index.updateDocuments({
    documents: [{ _id: 'doc', setFields: { category: 'fiction' } }],
  });
  await index.deleteDocuments({ ids: ['doc'] });
  const namespace: NamespaceDescription = await index.createNamespace({
    name: 'tenant',
  });
  await index.listNamespaces({ limit: 10 });
  if (namespace.name) await index.describeNamespace(namespace.name);
  if (namespace.name) await index.deleteNamespace(namespace.name);

  const records: PineconeRecord<{ category: string }>[] = [
    { id: 'vector', values: [1, 0], metadata: { category: 'books' } },
  ];
  await index.upsert({ records });
  const query: QueryResponse<{ category: string }> = await index.query({
    vector: [1, 0],
    topK: 3,
    includeMetadata: true,
  });
  const category: string | undefined = query.matches[0]?.metadata?.category;
  await index.fetch({ ids: ['vector'] });
  await index.update({ id: 'vector', metadata: { category: 'fiction' } });
  await index.listPaginated({ limit: 10 });
  await index.describeIndexStats();
  await index.deleteOne({ id: 'vector' });
  await index.upsert({
    // @ts-expect-error metadata keeps the consumer's declared field types
    records: [{ id: 'bad', values: [1, 0], metadata: { category: 1 } }],
  });
  // @ts-expect-error document search requires scoring methods
  await index.searchDocuments({ topK: 3 });

  const backup: BackupModel = await pc.backups.create('source', {
    name: 'backup',
  });
  const backups: BackupList = await pc.backups.list({ limit: 10 });
  await pc.backups.listByIndex('source', { includeDeleted: true });
  await pc.backups.describe(backup.backupId);
  const restored: CreateIndexFromBackupResponse = await pc.backups.createIndex(
    backup.backupId,
    { name: 'restored' },
  );
  const restore: RestoreJobModel = await pc.restoreJobs.describe(
    restored.restoreJobId,
  );
  await pc.restoreJobs.list({ limit: 10 });
  await pc.backups.delete(backup.backupId);

  const collection: CollectionModel = await pc.collections.create({
    name: 'collection',
    source: 'pod-index',
  });
  const collections: CollectionList = await pc.collections.list();
  await pc.collections.describe(collection.name);
  await pc.collections.delete(collection.name);
  const assistant: AssistantModel = await pc.assistants.create({
    name: 'assistant',
  });
  const assistants: AssistantList = await pc.assistants.list();
  await pc.assistants.describe(assistant.name);
  await pc.assistants.update({
    name: assistant.name,
    instructions: 'Be concise.',
  });
  await pc.assistants.delete(assistant.name);
  const models: ModelInfoList = await pc.inference.listModels();
  await pc.inference.getModel('multilingual-e5-large');
  void [
    described,
    matches,
    fetched,
    category,
    backups,
    restore,
    collections,
    assistants,
    models,
  ];
}
