import { scripts } from '../../package.json';
import {
  UpdateDocumentsRequestToJSON,
  VectorToJSON,
} from '../pinecone-generated-ts-fetch/db_data';
import { IndexSchemaFieldFromJSON } from '../pinecone-generated-ts-fetch/db_control';

import { X_PINECONE_API_VERSION as controlVersion } from '../pinecone-generated-ts-fetch/db_control/api_version';
import { X_PINECONE_API_VERSION as dataVersion } from '../pinecone-generated-ts-fetch/db_data/api_version';
import { X_PINECONE_API_VERSION as inferenceVersion } from '../pinecone-generated-ts-fetch/inference/api_version';
import { X_PINECONE_API_VERSION as assistantControlVersion } from '../pinecone-generated-ts-fetch/assistant_control/api_version';
import { X_PINECONE_API_VERSION as assistantDataVersion } from '../pinecone-generated-ts-fetch/assistant_data/api_version';
import { X_PINECONE_API_VERSION as assistantEvaluationVersion } from '../pinecone-generated-ts-fetch/assistant_evaluation/api_version';
import { X_PINECONE_API_VERSION as adminVersion } from '../pinecone-generated-ts-fetch/admin/api_version';

// Regeneration must keep each module's request header aligned with the spec
// selected by the generation command, including Assistant and inference.
describe('generated API versions', () => {
  const specVersion = scripts['generate:openapi'].match(
    /build-oas\.sh (\d{4}-\d{2})/,
  )?.[1];

  test.each([
    ['db_control', controlVersion],
    ['db_data', dataVersion],
    ['inference', inferenceVersion],
    ['assistant_control', assistantControlVersion],
    ['assistant_data', assistantDataVersion],
    ['assistant_evaluation', assistantEvaluationVersion],
    ['admin', adminVersion],
  ])('%s sends the generated spec version', (_module, headerVersion) => {
    expect(specVersion).toBeDefined();
    expect(headerVersion).toBe(specVersion);
  });
});

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
