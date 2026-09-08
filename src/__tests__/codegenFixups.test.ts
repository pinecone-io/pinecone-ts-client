import {
  UpdateDocumentsRequestToJSON,
  VectorToJSON,
} from '../pinecone-generated-ts-fetch/db_data';
import { IndexSchemaFieldFromJSON } from '../pinecone-generated-ts-fetch/db_control';

// Pins the post-generation fixups in `codegen/build-oas.sh`. Each fixup repairs
// a union the generator collapsed into a single concrete interface; the
// collapsed form still type-checks, so only an assertion on a round-tripped
// value fails when a fixup silently stops reapplying after a regen.
describe('codegen fixups survive regeneration', () => {
  test('updateDocuments setFields round-trips scalars and arrays', () => {
    const body = UpdateDocumentsRequestToJSON({
      filter: { category: 'product' },
      setFields: {
        title: 'hello',
        rank: 7,
        published: true,
        tags: ['a', 'b'],
        embedding: { indices: [1], values: [0.5] },
      },
    });

    expect(body.set_fields).toEqual({
      title: 'hello',
      rank: 7,
      published: true,
      tags: ['a', 'b'],
      embedding: { indices: [1], values: [0.5] },
    });
  });

  test('vector metadata round-trips scalars and arrays', () => {
    const body = VectorToJSON({
      id: 'v1',
      values: [0.1, 0.2],
      metadata: { title: 'hello', rank: 7, published: true, tags: ['a'] },
    });

    expect(body.metadata).toEqual({
      title: 'hello',
      rank: 7,
      published: true,
      tags: ['a'],
    });
  });

  test('a typed IndexSchemaField keeps its type-specific properties', () => {
    const field = IndexSchemaFieldFromJSON({
      type: 'dense_vector',
      dimension: 1536,
      metric: 'cosine',
    });

    expect(field).toMatchObject({
      type: 'dense_vector',
      dimension: 1536,
      metric: 'cosine',
    });
  });
});
