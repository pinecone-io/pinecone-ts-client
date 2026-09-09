import { X_PINECONE_API_VERSION as controlVersion } from '../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION as dataVersion } from '../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION as adminVersion } from '../pinecone-generated-ts-fetch/admin';
import { X_PINECONE_API_VERSION as inferenceVersion } from '../pinecone-generated-ts-fetch/inference';
import { X_PINECONE_API_VERSION as assistantControlVersion } from '../pinecone-generated-ts-fetch/assistant_control';
import { X_PINECONE_API_VERSION as assistantDataVersion } from '../pinecone-generated-ts-fetch/assistant_data';
import { X_PINECONE_API_VERSION as assistantEvaluationVersion } from '../pinecone-generated-ts-fetch/assistant_evaluation';
import { indexOperationsBuilder } from '../control/indexOperationsBuilder';
import { adminOperationsBuilder } from '../admin/adminOperationsBuilder';
import { inferenceOperationsBuilder } from '../inference/inferenceOperationsBuilder';
import { asstControlOperationsBuilder } from '../assistant/control/asstControlOperationsBuilder';
import { asstMetricsOperationsBuilder } from '../assistant/control/asstMetricsOperationsBuilder';
import { AsstDataOperationsProvider } from '../assistant/data/asstDataOperationsProvider';
import { VectorOperationsProvider } from '../data/vectors/vectorOperationsProvider';
import { DocumentOperationsProvider } from '../data/documents/documentOperationsProvider';
import { NamespaceOperationsProvider } from '../data/namespaces/namespacesOperationsProvider';
import { BulkOperationsProvider } from '../data/bulk/bulkOperationsProvider';

// These literals deliberately do not derive from the generated constants.
// All surfaces use 2026-07 following #110; a version change must explicitly
// update these expectations as well as the generated code.
describe('API version pins', () => {
  test.each([
    ['db_control', controlVersion, '2026-07'],
    ['db_data', dataVersion, '2026-07'],
    ['admin', adminVersion, '2026-07'],
    ['inference', inferenceVersion, '2026-07'],
    ['assistant_control', assistantControlVersion, '2026-07'],
    ['assistant_data', assistantDataVersion, '2026-07'],
    ['assistant_evaluation', assistantEvaluationVersion, '2026-07'],
  ])('%s stays on its approved API version', (_module, actual, expected) => {
    expect(actual).toBe(expected);
  });

  const config = { apiKey: 'test-api-key' };
  const host = 'https://data.test.pinecone.io';
  test.each([
    ['control', () => indexOperationsBuilder(config), '2026-07'],
    [
      'admin',
      () =>
        adminOperationsBuilder({
          clientId: 'test-client',
          clientSecret: 'test-secret',
        }).projects,
      '2026-07',
    ],
    ['inference', () => inferenceOperationsBuilder(config), '2026-07'],
    [
      'assistant control',
      () => asstControlOperationsBuilder(config),
      '2026-07',
    ],
    [
      'assistant evaluation',
      () => asstMetricsOperationsBuilder(config),
      '2026-07',
    ],
    [
      'assistant data',
      () =>
        new AsstDataOperationsProvider(config, 'assistant', host).provideData(),
      '2026-07',
    ],
    [
      'vectors',
      () => new VectorOperationsProvider(config, 'index', host).provide(),
      '2026-07',
    ],
    [
      'documents',
      () => new DocumentOperationsProvider(config, 'index', host).provide(),
      '2026-07',
    ],
    [
      'namespaces',
      () => new NamespaceOperationsProvider(config, 'index', host).provide(),
      '2026-07',
    ],
    [
      'bulk',
      () => new BulkOperationsProvider(config, 'index', host).provide(),
      '2026-07',
    ],
  ] as const)(
    '%s configures the literal API-version header',
    async (_name, build, expected) => {
      const api = await build();
      expect(api['configuration'].headers?.['X-Pinecone-Api-Version']).toBe(
        expected,
      );
    },
  );
});
