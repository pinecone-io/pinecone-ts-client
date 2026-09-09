import {
  deriveDimension,
  deriveMetric,
  deriveVectorType,
  formatDeriveFailure,
} from '../legacyAccessors';
import { fixtures } from './fixtures/indexModels';

describe('legacy property guidance', () => {
  test('names the unavailable property, actual sparse field, and schema inspection code', () => {
    const result = deriveDimension(fixtures.namedSparse);
    if (result.outcome !== 'error')
      throw new Error('Expected an unavailable dimension');
    expect(formatDeriveFailure(result.failure)).toBe(
      'Cannot read `dimension` from index "test-index": this documents-API index shape has no equivalent legacy property; this shape did not exist before 2026-07. Its schema declares: "keywords" (sparse_vector). Inspect the field you need with `Object.entries(index.schema.fields)`.',
    );
  });
  test('shows model lookup when model information is not reported', () => {
    const result = deriveDimension(fixtures.integratedNoMetric);
    if (result.outcome !== 'error')
      throw new Error('Expected an unavailable dimension');
    expect(formatDeriveFailure(result.failure)).toBe(
      'Cannot read `dimension` from index "test-index": the API does not report this property on the integrated model field. Its schema declares: "chunk_text" (semantic_text, model llama-text-embed-v2). Look up the model with `await pc.inference.getModel("llama-text-embed-v2")`.',
    );
  });
  test('reports readiness separately from a ready empty schema', () => {
    const result = deriveDimension(fixtures.initializing);
    if (result.outcome !== 'error')
      throw new Error('Expected an unavailable dimension');
    expect(formatDeriveFailure(result.failure)).toBe(
      'Cannot read `dimension` from index "test-index": the schema is empty and the index is not ready (state "Initializing"). Wait for readiness and describe it again with `await pc.indexes.describe("test-index")`.',
    );
  });
  for (const [name, fixture] of Object.entries(fixtures)) {
    for (const derive of [deriveDimension, deriveMetric, deriveVectorType]) {
      const result = derive(fixture);
      if (result.outcome !== 'error') continue;
      test(`${name} ${derive.name} names the index, fields, and replacement code`, () => {
        const message = formatDeriveFailure(result.failure);
        expect(message).toContain(JSON.stringify(fixture.name));
        expect(message).toContain('`');
        Object.keys(fixture.schema.fields).forEach((field) =>
          expect(message).toContain(field),
        );
      });
    }
  }
});
