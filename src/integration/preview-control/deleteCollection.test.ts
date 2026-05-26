import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview deleteCollection', () => {
  test('deletes a collection successfully', async () => {
    const collectionName = process.env.PINECONE_COLLECTION_NAME;
    if (!collectionName) {
      test.skip;
      return;
    }

    await expect(
      pc.preview.indexes.deleteCollection(collectionName),
    ).resolves.toBeUndefined();
  });

  test('throws when collection does not exist', async () => {
    await expect(
      pc.preview.indexes.deleteCollection('nonexistent-collection-xyz'),
    ).rejects.toBeDefined();
  });
});
