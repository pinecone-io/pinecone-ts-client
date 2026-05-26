import { Pinecone } from '../../index';

describe('preview listCollections', () => {
  let pc: Pinecone;

  beforeAll(() => {
    pc = new Pinecone();
  });

  test('returns a list (possibly empty) without error', async () => {
    const result = await pc.preview.indexes.listCollections();
    expect(result).toHaveProperty('collections');
    expect(Array.isArray(result.collections)).toBe(true);
  });

  test('each collection in the list has a name', async () => {
    const result = await pc.preview.indexes.listCollections();
    if (result.collections && result.collections.length > 0) {
      for (const collection of result.collections) {
        expect(typeof collection.name).toBe('string');
        expect(collection.name.length).toBeGreaterThan(0);
      }
    } else {
      console.log('No collections found, skipping name assertion');
    }
  });
});
