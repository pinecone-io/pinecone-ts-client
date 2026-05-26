import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview describeCollection', () => {
  test('describes a collection that was just created', async () => {
    const collectionName = process.env.PINECONE_COLLECTION_NAME;
    if (!collectionName) {
      test.skip;
      return;
    }

    const result = await pc.preview.indexes.describeCollection(collectionName);

    expect(result.name).toEqual(collectionName);
    expect(['Initializing', 'Ready', 'Terminating']).toContain(result.status);
    expect(result.environment).toBeTruthy();
  });

  test('throws when collection does not exist', async () => {
    await expect(
      pc.preview.indexes.describeCollection('nonexistent-collection-xyz'),
    ).rejects.toBeDefined();
  });
});
