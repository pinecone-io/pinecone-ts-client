import { Pinecone, Index } from '../../../index';
import type {
  DocumentRecord,
  FetchDocumentsResponse,
  ListDocumentsResponse,
} from '../../../index';
import {
  assertWithRetries,
  generateDocuments,
  randomName,
  vectorFieldName,
  retryDeletes,
} from '../../test-helpers';

// Documents hold metadata in ordinary top-level fields, so the filter-mode
// test selects on this field rather than a nested `metadata` object.
const deleteGroupField = 'delete_group';
const filterGroup = 'by-filter';

let pinecone: Pinecone,
  serverlessIndexName: string,
  serverlessIndex: Index,
  untouchedNamespace: Index,
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
    timeout: 180_000,
    suppressConflicts: true,
    tags: { project: 'pinecone-integration-tests' },
  });
});

afterAll(async () => {
  if (!pinecone || !serverlessIndexName) return;
  await retryDeletes(pinecone, serverlessIndexName);
});

beforeEach(async () => {
  // Each mode gets a fresh namespace so a failure or filtered test run cannot
  // change another test's starting state.
  serverlessIndex = pinecone.index({
    name: serverlessIndexName,
    namespace: randomName('delete-mode'),
  });
  untouchedNamespace = pinecone.index({
    name: serverlessIndexName,
    namespace: randomName('delete-control'),
  });
  const documents = seedDocuments();
  recordIds = documents.map((document) => document._id);
  idGroupIds = recordIds.slice(0, 3);
  filterGroupIds = recordIds.slice(3);
  await serverlessIndex.upsertDocuments({ documents });
  await assertWithRetries(
    () => serverlessIndex.fetchDocuments({ ids: recordIds }),
    (result: FetchDocumentsResponse) => {
      recordIds.forEach((id) => {
        expect(result.documents[id]?._id).toEqual(id);
      });
    },
  );
});

// `deleteOne`, `deleteMany`, and `deleteAll` collapse into a single
// `deleteDocuments` accepting `ids`, `filter`, or `deleteAll`.
//
// Deletes are read-your-writes eventual, so every assertion below re-reads
// through `assertWithRetries` until it converges. Verification goes through
// fetch-by-ids (`listDocuments` only for the empty-namespace case).
describe('deleteDocuments', () => {
  test('delete by a single id removes only that document', async () => {
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
    const deletedIds = idGroupIds;

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

  test('delete by filter removes the matching documents', async () => {
    await serverlessIndex.deleteDocuments({
      filter: { [deleteGroupField]: { $eq: filterGroup } },
    });

    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        filterGroupIds.forEach((id) => {
          expect(result.documents[id]).toBeUndefined();
        });
        idGroupIds.forEach((id) => {
          expect(result.documents[id]?._id).toEqual(id);
        });
      },
    );
  });

  test('deleteAll empties only the selected namespace', async () => {
    // The same IDs in another namespace must survive the delete-all request.
    const documents = seedDocuments();
    await untouchedNamespace.upsertDocuments({ documents });
    await assertWithRetries(
      () => untouchedNamespace.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        recordIds.forEach((id) => {
          expect(result.documents[id]?._id).toEqual(id);
        });
      },
    );

    await serverlessIndex.deleteDocuments({ deleteAll: true });

    await assertWithRetries(
      () => serverlessIndex.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        expect(result.documents).toEqual({});
      },
    );
    await assertWithRetries(
      () => serverlessIndex.listDocuments({}),
      (result: ListDocumentsResponse) => {
        expect(result.documents).toEqual([]);
      },
    );
    await assertWithRetries(
      () => untouchedNamespace.fetchDocuments({ ids: recordIds }),
      (result: FetchDocumentsResponse) => {
        recordIds.forEach((id) => {
          expect(result.documents[id]?._id).toEqual(id);
        });
      },
    );
  });
});
