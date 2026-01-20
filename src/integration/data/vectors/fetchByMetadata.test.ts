import { Index } from '../../../data';
import { Pinecone } from '../../../pinecone';
import { globalNamespaceOne } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone,
  serverlessIndex: Index,
  metadataKey: string,
  metadataValue: any;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });

  metadataKey = fixtures.serverlessIndex.metadataFilter.key;
  metadataValue = fixtures.serverlessIndex.metadataFilter.value;
});

describe('fetch by metadata', () => {
  test('fetch by metadata filter', async () => {
    const result = await serverlessIndex.fetchByMetadata({
      filter: { [metadataKey]: { $eq: metadataValue } },
    });
    Object.values(result.records).forEach((record) => {
      expect(record.metadata).toMatchObject({ [metadataKey]: metadataValue });
    });
  });
});
