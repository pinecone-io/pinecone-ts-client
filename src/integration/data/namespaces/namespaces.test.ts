import { Index, ListNamespacesResponse, Pinecone } from '../../../index';
import { PineconeNotFoundError } from '../../../errors';
import {
  assertWithRetries,
  generateDocuments,
  randomName,
} from '../../test-helpers';
import { getTestContext } from '../../test-context';

const namespacePrefix = randomName('namespaces');
const namespaceOne = `${namespacePrefix}-one`;
const namespaceTwo = `${namespacePrefix}-two`;
const namespaceThree = `${namespacePrefix}-three`;
const namespaceToDelete = `${namespacePrefix}-delete`;
let pinecone: Pinecone, serverlessIndexName: string;
let index: Index;

const expectNamespaces = (response: ListNamespacesResponse) => {
  expect(response.namespaces).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: namespaceOne }),
      expect.objectContaining({ name: namespaceTwo }),
    ]),
  );
};

describe('namespaces operations', () => {
  beforeAll(async () => {
    const fixtures = await getTestContext();
    pinecone = fixtures.client;
    serverlessIndexName = fixtures.serverlessIndex.name;
    index = pinecone.index({ name: serverlessIndexName });

    const documents = generateDocuments({
      dimension: fixtures.serverlessIndex.dimension,
      quantity: 5,
      fieldName: fixtures.serverlessIndex.vectorFieldName,
    });
    for (const namespace of [namespaceOne, namespaceTwo]) {
      await index.namespace(namespace).upsertDocuments({ documents });
    }
    await assertWithRetries(
      () => index.listNamespaces({ prefix: namespacePrefix }),
      expectNamespaces,
    );
  });

  afterAll(async () => {
    if (!index) return;
    const results = await Promise.allSettled(
      [namespaceOne, namespaceTwo, namespaceThree, namespaceToDelete].map(
        async (namespace) => {
          try {
            await index.deleteNamespace(namespace);
          } catch (error) {
            if (!(error instanceof PineconeNotFoundError)) throw error;
          }
        },
      ),
    );
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failures.length) {
      throw new AggregateError(
        failures.map((result) => result.reason),
        'Failed to clean up integration namespaces',
      );
    }
  });

  test('create namespace', async () => {
    const response = await index.createNamespace({
      name: namespaceThree,
      schema: { fields: { test: { filterable: true } } },
    });
    expect(response.name).toEqual(namespaceThree);
    expect(response.schema?.fields?.test.filterable).toBe(true);
  });

  test('list namespaces', async () => {
    expectNamespaces(await index.listNamespaces({ prefix: namespacePrefix }));
  });

  test('describe namespace', async () => {
    for (const name of [namespaceOne, namespaceTwo]) {
      const response = await index.describeNamespace(name);
      expect(response.name).toEqual(name);
    }
  });

  test('delete namespace removes it while retaining neighboring namespaces', async () => {
    await index.createNamespace({ name: namespaceToDelete });
    await assertWithRetries(
      () => index.listNamespaces({ prefix: namespacePrefix }),
      (response) => {
        expect(response.namespaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceToDelete }),
          ]),
        );
      },
    );
    await index.deleteNamespace(namespaceToDelete);
    await assertWithRetries(
      () => index.listNamespaces({ prefix: namespacePrefix }),
      (response) => {
        expectNamespaces(response);
        expect(response.namespaces).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceToDelete }),
          ]),
        );
      },
    );
  });
});
