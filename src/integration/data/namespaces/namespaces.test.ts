import { ListNamespacesResponse, Pinecone } from '../../../index';
import {
  assertWithRetries,
  generateRecords,
  sleep,
  randomName,
} from '../../test-helpers';
import { getTestContext } from '../../test-context';

const namespaceOne = randomName('namespace-one');
const namespaceTwo = randomName('namespace-two');
const namespaceThree = randomName('namespace-three');
let pinecone: Pinecone, serverlessIndexName: string;

describe('namespaces operations', () => {
  beforeAll(async () => {
    const fixtures = await getTestContext();
    pinecone = fixtures.client;
    serverlessIndexName = fixtures.serverlessIndex.name;

    const serverlessIndexNsOne = pinecone.index({
      name: serverlessIndexName,
      namespace: namespaceOne,
    });

    const serverlessIndexNsTwo = pinecone.index({
      name: serverlessIndexName,
      namespace: namespaceTwo,
    });

    // Seed indexes
    const recordsToUpsert = generateRecords({ dimension: 2, quantity: 5 });
    await serverlessIndexNsOne.upsert(recordsToUpsert);
    await serverlessIndexNsTwo.upsert(recordsToUpsert);
    await sleep(2000); // Wait for the upsert operations to complete
  });

  // Tests deleteNamespace
  afterAll(async () => {
    await pinecone
      .index({ name: serverlessIndexName })
      .deleteNamespace(namespaceThree);

    await assertWithRetries(
      () => pinecone.index({ name: serverlessIndexName }).listNamespaces(),
      (response: ListNamespacesResponse) => {
        expect(response.namespaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceOne }),
          ]),
        );
        expect(response.namespaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceTwo }),
          ]),
        );
        expect(response.namespaces).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceThree }),
          ]),
        );
      },
      240000,
    );
  });

  test('create namespace', async () => {
    const response = await pinecone
      .index({ name: serverlessIndexName })
      .createNamespace({
        name: namespaceThree,
        schema: { fields: { test: { filterable: true } } },
      });

    expect(response.name).toEqual(namespaceThree);
    expect(response.schema?.fields.test.filterable).toBe(true);
  });

  test('list namespaces', async () => {
    const response = await pinecone
      .index({ name: serverlessIndexName })
      .listNamespaces();

    expect(response.namespaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: namespaceOne }),
        expect.objectContaining({ name: namespaceTwo }),
      ]),
    );
  });

  test('describe namespace', async () => {
    let response = await pinecone
      .index({ name: serverlessIndexName })
      .describeNamespace(namespaceOne);

    expect(response.name).toEqual(namespaceOne);

    response = await pinecone
      .index({ name: serverlessIndexName })
      .describeNamespace(namespaceTwo);
    expect(response.name).toEqual(namespaceTwo);
  });
});
