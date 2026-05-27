import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview describeCollection', () => {
  const collectionName = process.env.PINECONE_COLLECTION_NAME;

  (collectionName ? test : test.skip)(
    'describes a collection that was just created (requires PINECONE_COLLECTION_NAME)',
    async () => {
      const result =
        await pc.preview.indexes.describeCollection(collectionName!);

      expect(result.name).toEqual(collectionName);
      expect(['Initializing', 'Ready', 'Terminating']).toContain(result.status);
      expect(result.environment).toBeTruthy();
    },
  );

  test('throws when collection does not exist', async () => {
    await expect(
      pc.preview.indexes.describeCollection('nonexistent-collection-xyz'),
    ).rejects.toBeDefined();
  });
});
