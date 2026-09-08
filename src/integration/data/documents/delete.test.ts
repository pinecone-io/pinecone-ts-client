import { Pinecone, Index } from '../../../index';
import type {
  DocumentRecord,
  FetchDocumentsResponse,
  ListDocumentsResponse,
} from '../../../index';
import {
  assertWithRetries,
  generateDocuments,
  globalNamespaceOne,
  randomName,
  vectorFieldName,
  waitUntilIndexReady,
  waitUntilRecordsReady,
} from '../../test-helpers';

// Documents hold metadata in ordinary top-level fields, so the filter-mode
// test selects on this field rather than a nested `metadata` object.
const deleteGroupField = 'delete_group';
const filterGroup = 'by-filter';

let pinecone: Pinecone,
  serverlessIndexName: string,
  serverlessIndex: Index,
  recordIds: string[],
  idGroupIds: string[],
  filterGroupIds: string[];

const seedDocuments = (): DocumentRecord[] =>
  generateDocuments({ dimension: 5, quantity: 5 }).map((doc, i) => ({
    ...doc,
    [deleteGroupField]: i < 3 ? 'by-id' : filterGroup,
  }));

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndexName = randomName('integration-test-serverless-delete');

  await pinecone.indexes.create({
    name: serverlessIndexName,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-west-2',
    },
    schema: {
      fields: {
        [vectorFieldName]: {
          type: 'dense_vector',
          dimension: 5,
          metric: 'cosine',
        },
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  serverlessIndex = pinecone.index({
    name: serverlessIndexName,
    namespace: globalNamespaceOne,
  });

  // Seed index
  const documentsToUpsert = seedDocuments();
  recordIds = documentsToUpsert.map((d) => d._id);
  idGroupIds = recordIds.slice(0, 3);
  filterGroupIds = recordIds.slice(3);
  await serverlessIndex.upsertDocuments({ documents: documentsToUpsert });
});

afterAll(async () => {
  await waitUntilIndexReady(serverlessIndexName);
  await pinecone.indexes.delete(serverlessIndexName);
});

// `deleteOne`, `deleteMany`, and `deleteAll` collapse into a single
// `deleteDocuments` accepting `ids`, `filter`, or `deleteAll`.
//
// Deletes are read-your-writes eventual, so every assertion below re-reads
// through `assertWithRetries` until it converges. Verification goes through
// fetch-by-ids (`listDocuments` only for the empty-namespace case) because
// fetch-by-filter is itself broken on the 2026-07 fleet; see
// pinecone-ts-client-internal#17.
describe('deleteDocuments', () => {
  test('delete by a single id removes only that document', async () => {
    // Await record freshness, and check documents upserted
    await waitUntilRecordsReady(serverlessIndex, globalNamespaceOne, recordIds);

    const deletedId = idGroupIds[0];
    await serverlessIndex.deleteDocuments({ ids: [deletedId] });

    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        expect(result.documents[deletedId]).toBeUndefined();
        recordIds
          .filter((id) => id !== deletedId)
          .forEach((id) => {
            expect(result.documents[id]._id).toEqual(id);
          });
      },
    );
  });

  test('delete by multiple ids removes every id passed', async () => {
    const deletedIds = idGroupIds.slice(1);

    await serverlessIndex.deleteDocuments({ ids: deletedIds });

    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        idGroupIds.forEach((id) => {
          expect(result.documents[id]).toBeUndefined();
        });
        filterGroupIds.forEach((id) => {
          expect(result.documents[id]._id).toEqual(id);
        });
      },
    );
  });

  // Not yet exercised against prod. Its sibling filter modes are both broken
  // on the 2026-07 fleet (update-by-filter 400s, #15; fetch-by-filter 500s,
  // #17), so a failure here is more likely a fleet gap than a client bug — in
  // which case skip it with its own tracking issue rather than reinstating a
  // mock.
  test('delete by filter removes the matching documents', async () => {
    await serverlessIndex.deleteDocuments({
      filter: { [deleteGroupField]: { $eq: filterGroup } },
    });

    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: filterGroupIds }),
      (result: FetchDocumentsResponse) => {
        filterGroupIds.forEach((id) => {
          expect(result.documents[id]).toBeUndefined();
        });
      },
    );
  });

  test('deleteAll empties the namespace', async () => {
    const documentsToUpsert = generateDocuments({
      dimension: 5,
      quantity: 3,
      prefix: 'delete-all',
    });
    const reseededIds = documentsToUpsert.map((d) => d._id);

    await serverlessIndex.upsertDocuments({ documents: documentsToUpsert });

    // `waitUntilRecordsReady` is count-exact over the whole namespace, which
    // would be wrong here: an earlier test in this file may have been skipped
    // and left its documents behind. Wait on the re-seeded ids instead.
    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: reseededIds }),
      (result: FetchDocumentsResponse) => {
        reseededIds.forEach((id) => {
          expect(result.documents[id]._id).toEqual(id);
        });
      },
    );

    await serverlessIndex.deleteDocuments({ deleteAll: true });

    await assertWithRetries(
      () => serverlessIndex.listDocuments({}),
      (result: ListDocumentsResponse) => {
        expect(result.documents).toEqual([]);
      },
    );
  });
});
