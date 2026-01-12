import { ListNamespacesResponse, Pinecone } from '../../../index';
import { assertWithRetries, generateRecords, sleep } from '../../test-helpers';

const namespaceOne = 'namespace-one';
const namespaceTwo = 'namespace-two';
let pinecone: Pinecone, serverlessIndexName: string;

describe('namespaces operations', () => {
  beforeAll(async () => {
    pinecone = new Pinecone();
    if (!process.env.SERVERLESS_INDEX_NAME) {
      throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
    }
    serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
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
      .deleteNamespace(namespaceTwo);

    await assertWithRetries(
      () => pinecone.index({ name: serverlessIndexName }).listNamespaces(),
      (response: ListNamespacesResponse) => {
        expect(response.namespaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceOne }),
          ])
        );
        expect(response.namespaces).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: namespaceTwo }),
          ])
        );
      }
    );
  });

  test('list namespaces', async () => {
    const response = await pinecone
      .index({ name: serverlessIndexName })
      .listNamespaces();

    expect(response.namespaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: namespaceOne }),
        expect.objectContaining({ name: namespaceTwo }),
      ])
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
