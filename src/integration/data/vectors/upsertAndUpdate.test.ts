import { Index, Pinecone, RecordMetadata } from '../../../index';
import {
  assertWithRetries,
  generateRecords,
  globalNamespaceOne,
  randomName,
  waitUntilRecordsReady,
} from '../../test-helpers';
import type { FetchResponse } from '../../../data/vectors/fetch';
import type { FetchByMetadataResponse } from '../../../data/vectors/fetchByMetadata';

let pinecone: Pinecone;
let srvrlssIndexDense: Index;
let srvrlssIndexDenseName: string;
let srvrlssIndexSparse: Index;
let srvrlssIndexSparseName: string;
let denseRecordIds: string[];
let sparseRecordIds: string[];
let denseMetadata: RecordMetadata;
let sparseMetadata: RecordMetadata;

// upserts against two indexes (dense & sparse) and seeds them with test data
beforeAll(async () => {
  pinecone = new Pinecone();
  srvrlssIndexDenseName = randomName('test-srvrlss-dense-upsert-update');
  srvrlssIndexSparseName = randomName('test-srvrlss-sparse-upsert-update');

  const densePromise = pinecone.createIndex({
    name: srvrlssIndexDenseName,
    dimension: 2,
    metric: 'cosine',
    spec: {
      serverless: {
        region: 'us-east-1',
        cloud: 'aws',
      },
    },
    vectorType: 'dense',
    waitUntilReady: true,
    suppressConflicts: true,
  });

  const sparsePromise = pinecone.createIndex({
    name: srvrlssIndexSparseName,
    metric: 'dotproduct',
    spec: {
      serverless: {
        region: 'us-east-1',
        cloud: 'aws',
      },
    },
    vectorType: 'sparse',
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
  const sparseRecords = generateRecords({
    dimension: 2,
    quantity: 1,
    withSparseValues: true,
    withValues: false,
    withMetadata: true,
  });
  const denseRecords = generateRecords({
    dimension: 2,
    quantity: 1,
    withSparseValues: false,
    withMetadata: true,
  });

  denseMetadata = denseRecords[0].metadata || {};
  sparseMetadata = sparseRecords[0].metadata || {};

  // test upserts
  await Promise.all([
    srvrlssIndexSparse.upsert(sparseRecords),
    srvrlssIndexDense.upsert(denseRecords),
  ]);

  sparseRecordIds = sparseRecords.map((record) => record.id);
  denseRecordIds = denseRecords.map((record) => record.id);

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
  const deleteDense = pinecone.deleteIndex(srvrlssIndexDenseName);
  const deleteSparse = pinecone.deleteIndex(srvrlssIndexSparseName);

  await Promise.all([deleteDense, deleteSparse]);
});

describe('update', () => {
  describe('dense indexes', () => {
    test('verify update by id', async () => {
      const recordId = denseRecordIds[0];
      const newValues = [0.5, 0.4];
      const newMetadata = { flavor: 'chocolate' };

      await srvrlssIndexDense.update({
        id: recordId,
        values: newValues,
        metadata: newMetadata,
      });

      await assertWithRetries(
        () => srvrlssIndexDense.fetch([recordId]),
        (result: FetchResponse) => {
          expect(result.records[recordId]).toBeDefined();
          expect(result.records[recordId].values).toEqual(newValues);
          expect(result.records[recordId].metadata).toMatchObject(newMetadata);
        },
      );
    });

    test('verify update by metadata (filter)', async () => {
      const metadataKey = Object.keys(denseMetadata)[0];
      const metadataValue = denseMetadata[metadataKey];
      const newMetadata = { flavor: 'vanilla' };

      await srvrlssIndexDense.update({
        filter: { [metadataKey]: { $eq: metadataValue } },
        metadata: newMetadata,
      });

      await assertWithRetries(
        () =>
          srvrlssIndexDense.fetchByMetadata({
            filter: { [metadataKey]: { $eq: metadataValue } },
          }),
        (result: FetchByMetadataResponse) => {
          const record = Object.values(result.records)[0];
          expect(record).toBeDefined();
          expect(record.metadata).toMatchObject(newMetadata);
        },
      );
    });
  });

  describe('sparse indexes', () => {
    test('verify update by id', async () => {
      const recordId = sparseRecordIds[0];
      const newSparseValues = [0.5, 0.4];
      const newSparseIndices = [0, 1];
      const sparseValues = {
        values: newSparseValues,
        indices: newSparseIndices,
      };
      const newMetadata = { flavor: 'chocolate' };

      await srvrlssIndexSparse.update({
        id: recordId,
        sparseValues: sparseValues,
        metadata: newMetadata,
      });

      await assertWithRetries(
        () => srvrlssIndexSparse.fetch([recordId]),
        (result: FetchResponse) => {
          expect(result.records[recordId]).toBeDefined();
          expect(result.records[recordId].sparseValues).toEqual(sparseValues);
          expect(result.records[recordId].metadata).toMatchObject(newMetadata);
        },
      );
    });

    test('verify update by metadata (filter)', async () => {
      const metadataKey = Object.keys(sparseMetadata)[0];
      const metadataValue = sparseMetadata[metadataKey];
      const newMetadata = { flavor: 'vanilla' };

      await srvrlssIndexSparse.update({
        filter: { [metadataKey]: { $eq: metadataValue } },
        metadata: newMetadata,
      });

      await assertWithRetries(
        () =>
          srvrlssIndexSparse.fetchByMetadata({
            filter: { [metadataKey]: { $eq: metadataValue } },
          }),
        (result: FetchByMetadataResponse) => {
          const record = Object.values(result.records)[0];
          expect(record).toBeDefined();
          expect(record.metadata).toMatchObject(newMetadata);
        },
      );
    });
  });
});
