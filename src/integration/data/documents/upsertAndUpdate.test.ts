import { Index, Pinecone } from '../../../index';
import type { FetchDocumentsResponse } from '../../../index';
import {
  assertWithRetries,
  generateDocuments,
  globalNamespaceOne,
  randomName,
  vectorFieldName,
  waitUntilRecordsReady,
} from '../../test-helpers';

const sparseFieldName = 'sparse_embedding';

let pinecone: Pinecone,
  srvrlssIndexDenseName: string,
  srvrlssIndexDense: Index,
  srvrlssIndexSparseName: string,
  srvrlssIndexSparse: Index,
  denseRecordIds: string[],
  sparseRecordIds: string[],
  denseMetadata: Record<string, any>,
  sparseMetadata: Record<string, any>;

beforeAll(async () => {
  pinecone = new Pinecone();
  srvrlssIndexDenseName = randomName('test-srvrlss-dense-upsert-update');
  srvrlssIndexSparseName = randomName('test-srvrlss-sparse-upsert-update');

  const densePromise = pinecone.indexes.create({
    name: srvrlssIndexDenseName,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-east-1',
    },
    schema: {
      fields: {
        [vectorFieldName]: {
          type: 'dense_vector',
          dimension: 2,
          metric: 'cosine',
        },
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  const sparsePromise = pinecone.indexes.create({
    name: srvrlssIndexSparseName,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-east-1',
    },
    schema: {
      fields: {
        [sparseFieldName]: { type: 'sparse_vector' },
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  await Promise.all([densePromise, sparsePromise]);

  srvrlssIndexDense = pinecone.index({
    name: srvrlssIndexDenseName,
    namespace: globalNamespaceOne,
  });
  srvrlssIndexSparse = pinecone.index({
    name: srvrlssIndexSparseName,
    namespace: globalNamespaceOne,
  });

  // Seed indexes
  const denseDocuments = generateDocuments({
    dimension: 2,
    quantity: 1,
    withMetadata: true,
  });
  const sparseDocuments = generateDocuments({
    dimension: 2,
    quantity: 1,
    withValues: false,
    withMetadata: true,
  }).map((doc) => ({
    ...doc,
    [sparseFieldName]: { indices: [0, 1], values: [0.1, 0.2] },
  }));

  const nonFieldKeys = (doc: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(doc).filter(
        ([k]) => k !== '_id' && k !== vectorFieldName && k !== sparseFieldName,
      ),
    );
  denseMetadata = nonFieldKeys(denseDocuments[0]);
  sparseMetadata = nonFieldKeys(sparseDocuments[0]);

  // test upserts
  await Promise.all([
    srvrlssIndexSparse.upsertDocuments({ documents: sparseDocuments }),
    srvrlssIndexDense.upsertDocuments({ documents: denseDocuments }),
  ]);

  sparseRecordIds = sparseDocuments.map((doc) => doc._id);
  denseRecordIds = denseDocuments.map((doc) => doc._id);

  await Promise.all([
    waitUntilRecordsReady(
      srvrlssIndexSparse,
      globalNamespaceOne,
      sparseRecordIds,
    ),
    waitUntilRecordsReady(
      srvrlssIndexDense,
      globalNamespaceOne,
      denseRecordIds,
    ),
  ]);
});

afterAll(async () => {
  const deleteDense = pinecone.indexes.delete(srvrlssIndexDenseName);
  const deleteSparse = pinecone.indexes.delete(srvrlssIndexSparseName);

  await Promise.all([deleteDense, deleteSparse]);
});

describe('updateDocuments', () => {
  describe('dense indexes', () => {
    test('verify update by id', async () => {
      const recordId = denseRecordIds[0];
      const newValues = [0.5, 0.4];
      const newMetadata = { flavor: 'chocolate' };

      await srvrlssIndexDense.updateDocuments({
        documents: [
          { _id: recordId, [vectorFieldName]: newValues, ...newMetadata },
        ],
      });

      await assertWithRetries(
        () =>
          srvrlssIndexDense.fetchDocuments({
            ids: [recordId],
            includeFields: [vectorFieldName, 'flavor'],
          }),
        (result: FetchDocumentsResponse) => {
          const doc = result.documents[recordId];
          expect(doc).toBeDefined();
          expect(doc[vectorFieldName]).toEqual(newValues);
          expect(doc).toMatchObject(newMetadata);
        },
      );
    });

    test('verify update by metadata (filter)', async () => {
      const metadataKey = Object.keys(denseMetadata)[0];
      const metadataValue = denseMetadata[metadataKey];
      const newMetadata = { flavor: 'vanilla' };

      // Filter-based updates use `setFields` rather than an inline document.
      await srvrlssIndexDense.updateDocuments({
        filter: { [metadataKey]: { $eq: metadataValue } },
        setFields: newMetadata,
      });

      await assertWithRetries(
        () =>
          srvrlssIndexDense.fetchDocuments({
            filter: { [metadataKey]: { $eq: metadataValue } },
            includeFields: ['flavor'],
          }),
        (result: FetchDocumentsResponse) => {
          const doc = Object.values(result.documents)[0];
          expect(doc).toBeDefined();
          expect(doc).toMatchObject(newMetadata);
        },
      );
    });
  });

  describe('sparse indexes', () => {
    test('verify update by id', async () => {
      const recordId = sparseRecordIds[0];
      const newSparseValues = { indices: [0, 1], values: [0.5, 0.4] };
      const newMetadata = { flavor: 'chocolate' };

      await srvrlssIndexSparse.updateDocuments({
        documents: [
          { _id: recordId, [sparseFieldName]: newSparseValues, ...newMetadata },
        ],
      });

      await assertWithRetries(
        () =>
          srvrlssIndexSparse.fetchDocuments({
            ids: [recordId],
            includeFields: [sparseFieldName, 'flavor'],
          }),
        (result: FetchDocumentsResponse) => {
          const doc = result.documents[recordId];
          expect(doc).toBeDefined();
          expect(doc[sparseFieldName]).toEqual(newSparseValues);
          expect(doc).toMatchObject(newMetadata);
        },
      );
    });

    test('verify update by metadata (filter)', async () => {
      const metadataKey = Object.keys(sparseMetadata)[0];
      const metadataValue = sparseMetadata[metadataKey];
      const newMetadata = { flavor: 'vanilla' };

      await srvrlssIndexSparse.updateDocuments({
        filter: { [metadataKey]: { $eq: metadataValue } },
        setFields: newMetadata,
      });

      await assertWithRetries(
        () =>
          srvrlssIndexSparse.fetchDocuments({
            filter: { [metadataKey]: { $eq: metadataValue } },
            includeFields: ['flavor'],
          }),
        (result: FetchDocumentsResponse) => {
          const doc = Object.values(result.documents)[0];
          expect(doc).toBeDefined();
          expect(doc).toMatchObject(newMetadata);
        },
      );
    });
  });
});
