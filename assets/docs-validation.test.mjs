import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGeneratedWarning,
  scopeDocumentationWarnings,
} from './docs-validation.mjs';

test('only generated source diagnostics are excluded', () => {
  for (const directory of [
    'pinecone-generated-ts-fetch',
    'pinecone-generated-ts-fetch-alpha',
  ]) {
    assert.equal(
      isGeneratedWarning('Unknown tag', 42, {
        fileName: `/repo/src/${directory}/db_data/models/Model.ts`,
      }),
      true,
    );
    assert.equal(
      isGeneratedWarning(
        `Model.field (Property), defined in @pinecone-database/pinecone/src/${directory}/db_data/models/Model.ts, does not have any documentation`,
      ),
      true,
    );
    assert.equal(
      isGeneratedWarning(
        `Model, defined in @pinecone-database/pinecone/src/${directory}/db_data/models/Model.ts, is referenced by Client.foo but not included in the documentation`,
      ),
      true,
    );
  }
  assert.equal(
    isGeneratedWarning('Unknown tag', 42, {
      fileName: '/repo/src/pinecone.ts',
    }),
    false,
  );
  assert.equal(
    isGeneratedWarning('Unknown tag', 42, {
      fileName: '/repo/src/pinecone-generated-ts-fetch-lookalike/model.ts',
    }),
    false,
  );
  assert.equal(
    isGeneratedWarning(
      'Failed to resolve link to "src/pinecone-generated-ts-fetch/model" in comment for Pinecone',
    ),
    false,
  );
  assert.equal(isGeneratedWarning('An unrecognized diagnostic'), false);
});

test('excluded diagnostics do not increment warning or validation counters', () => {
  const logger = {
    warnings: 0,
    validationWarnings: 0,
    warn() {
      this.warnings++;
    },
    validationWarning(...args) {
      this.validationWarnings++;
      this.warn(...args);
    },
  };
  scopeDocumentationWarnings(logger);
  const generated = [
    'Unknown tag',
    42,
    { fileName: '/repo/src/pinecone-generated-ts-fetch/db_data/runtime.ts' },
  ];
  logger.warn(...generated);
  logger.validationWarning(...generated);
  assert.equal(logger.warnings, 0);
  assert.equal(logger.validationWarnings, 0);
  logger.warn('Handwritten parse warning');
  logger.validationWarning('Handwritten validation warning');
  assert.equal(logger.warnings, 2);
  assert.equal(logger.validationWarnings, 1);
});
