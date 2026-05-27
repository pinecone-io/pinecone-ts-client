import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview deleteCollection', () => {
  const collectionName = process.env.PINECONE_COLLECTION_NAME;

  (collectionName ? test : test.skip)(
    'deletes a collection successfully (requires PINECONE_COLLECTION_NAME)',
    async () => {
      await expect(
        pc.preview.indexes.deleteCollection(collectionName!),
      ).resolves.toBeUndefined();
    },
  );

  test('throws when collection does not exist', async () => {
    await expect(
      pc.preview.indexes.deleteCollection('nonexistent-collection-xyz'),
    ).rejects.toBeDefined();
  });
});
