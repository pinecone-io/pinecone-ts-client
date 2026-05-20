import { Pinecone } from '../../index';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview listRestoreJobs', () => {
  test('returns a data array without error', async () => {
    const result = await pc.preview.indexes.listRestoreJobs();
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('respects limit parameter', async () => {
    const result = await pc.preview.indexes.listRestoreJobs({ limit: 1 });
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });
});
