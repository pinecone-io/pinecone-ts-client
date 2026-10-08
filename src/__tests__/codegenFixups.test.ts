import { readFileSync } from 'fs';
import { join } from 'path';
import {
  UpdateDocumentsRequestToJSON,
  VectorToJSON,
} from '../pinecone-generated-ts-fetch/db_data';
import {
  CreateIndexSchemaFieldToJSON,
  IndexSchemaFieldFromJSON,
} from '../pinecone-generated-ts-fetch/db_control';

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
  test.each([
    ['db_control', controlVersion],
    ['db_data', dataVersion],
    ['inference', inferenceVersion],
    ['assistant_control', assistantControlVersion],
    ['assistant_data', assistantDataVersion],
    ['assistant_evaluation', assistantEvaluationVersion],
    ['admin', adminVersion],
  ])('%s sends the generated spec version', (module, headerVersion) => {
    const specVersion = readFileSync(
      join(__dirname, '../pinecone-generated-ts-fetch', module, 'runtime.ts'),
      'utf8',
    ).match(/The version of the OpenAPI document: (\d{4}-\d{2})/)?.[1];
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

  // Fails if codegen/strip-validation-only-composition.mjs stops applying:
  // `fullTextSearch` degrades to `object` and its keys pass through unconverted.
  test('a string field serializes its full-text search settings', () => {
    const body = CreateIndexSchemaFieldToJSON({
      type: 'string',
      fullTextSearch: {
        stemming: true,
        stopWords: true,
        ngram: { minGram: 2, maxGram: 3 },
      },
    });

    expect(body.full_text_search).toEqual({
      stemming: true,
      stop_words: true,
      ngram: { min_gram: 2, max_gram: 3 },
    });
  });
});
