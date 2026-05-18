import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview listIndexes', () => {
  test('returns a list (possibly empty) without error', async () => {
    const result = await pc.preview.indexes.listIndexes();
    expect(result).toHaveProperty('indexes');
    expect(Array.isArray(result.indexes)).toBe(true);
  });

  test('AlphaIndexModel shape includes name field', async () => {
    const result = await pc.preview.indexes.listIndexes();
    for (const index of result.indexes ?? []) {
      expect(typeof index.name).toBe('string');
    }
  });
});
