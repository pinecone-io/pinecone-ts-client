import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createCollection', () => {
  test('creates a collection and it appears in listCollections', async () => {
    const source = process.env.PINECONE_COLLECTION_SOURCE_INDEX;
    if (!source) {
      test.skip;
      return;
    }

    const name = randomName('preview-col');
    const result = await pc.preview.indexes.createCollection({ name, source });

    expect(result.name).toEqual(name);
    expect(result.status).toEqual('Initializing');
  });
});
