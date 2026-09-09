import { Pinecone } from '@pinecone-database/pinecone';

const p = new Pinecone();

(async () => {
  const indexList = await p.indexes.list();
  console.log(`Available indexes: ${JSON.stringify(indexList)}`);
})();

// CI runs `npm run start` on this file against the live API whenever a key is
// present, so anything that would create or mutate a resource has to stay off
// the executed path. This is never called: `tsc` still type-checks the bodies,
// which is the whole point of the fixture. Exported so `noUnusedLocals` --
// which the fixture's tsconfig enables -- does not reject it as dead.
export async function compileOnlySurfaceCoverage(): Promise<void> {
  await p.indexes.createForModel({
    name: 'compilation-test',
    cloud: 'aws',
    region: 'us-east-1',
    embed: {
      model: 'multilingual-e5-large',
      fieldMap: { text: 'chunk_text' },
    },
  });

  const ns = await p.index('compilation-test').describeNamespace('ns-1');
  const recordCount: string | undefined = ns.recordCount;
  console.log(`Records: ${recordCount}`);

  // Preserve legacy argument and return types alongside the resource API.
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
  } = p;

  // Exercise legacy argument shapes that differ from the resources.
  p.createBackup({ indexName: 'index', name: 'backup' });
  p.createIndexFromBackup({ backupId: 'backup', name: 'restored' });
  p.configureIndex({ name: 'index', deletionProtection: 'enabled' });
  p.listBackups();
  p.listBackups({ limit: 10, paginationToken: 'next' });
  p.listBackups({
    indexName: 'index',
    limit: 10,
    paginationToken: 'next',
    includeDeleted: true,
  });

  // @ts-expect-error legacy configure still requires the index name
  p.configureIndex({ deletionProtection: 'enabled' });
  // @ts-expect-error legacy listBackups uses an options object
  p.listBackups('index');
  // @ts-expect-error restored methods preserve typed response models
  const wrongResponse: Promise<string> = p.describeIndex('index');
  void wrongResponse;
  void methods;

  const docIndex = p.index('compilation-test');
  const scoped = docIndex.namespace('ns-1');

  // Preserve flat argument and return types alongside the documents accessor.
  const documentMethods: {
    upsertDocuments: (typeof docIndex)['documents']['upsert'];
    searchDocuments: (typeof docIndex)['documents']['search'];
    fetchDocuments: (typeof docIndex)['documents']['fetch'];
    updateDocuments: (typeof docIndex)['documents']['update'];
    listDocuments: (typeof docIndex)['documents']['list'];
    deleteDocuments: (typeof docIndex)['documents']['delete'];
  } = docIndex;

  const documents = [{ _id: 'doc-1', chunk_text: 'Hello world' }];
  await scoped.documents.upsert({ documents });
  await scoped.upsertDocuments({ documents });
  await docIndex.documents.list();
  await docIndex.listDocuments();

  const searchResults = await scoped.documents.search({
    scoreBy: [{ type: 'text', fields: ['chunk_text'], query: 'hello' }],
    topK: 5,
  });
  const matchCount: number = searchResults.matches.length;
  console.log(`Matches: ${matchCount}`);

  // @ts-expect-error the accessor still requires the documents payload
  await docIndex.documents.upsert();
  // @ts-expect-error the accessor preserves typed response models
  const wrongDocumentResponse: Promise<string> = docIndex.documents.fetch({
    ids: ['a'],
  });
  void wrongDocumentResponse;
  void documentMethods;
}

// Compiled only: preserve legacy response reads on resource and flat aliases.
export async function compileLegacyResponse(pc: Pinecone): Promise<void> {
  const model = await pc.indexes.describe('index');
  const dimension: number | undefined = model.dimension;
  const metric: string = model.metric;
  const vectorType: 'dense' | 'sparse' = model.vectorType;
  if (model.spec.serverless) {
    const mode: 'OnDemand' | 'Dedicated' =
      model.spec.serverless.readCapacity.mode;
    void mode;
  }
  const embedModel: string | undefined = model.embed?.model;
  const legacyMetric: string = (await pc.describeIndex('index')).metric;
  // @ts-expect-error legacy properties are getter-only
  model.dimension = 12;
  void [dimension, metric, vectorType, embedModel, legacyMetric];
}
