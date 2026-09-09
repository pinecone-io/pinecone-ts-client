import * as pureAccessors from '../legacyAccessors';
import {
  classifyIndexShape,
  deriveDimension,
  deriveMetric,
  deriveVectorType,
  deriveSpec,
  deriveEmbed,
} from '../legacyAccessors';
import type { Derived } from '../legacyAccessors';
import { fixtures, capacity } from './fixtures/indexModels';
import { RESERVED_VECTOR_FIELD_NAMES } from '../legacyConstants';

const value = (value: unknown) => ({ outcome: 'value', value });
const absent = { outcome: 'absent', because: 'inapplicable-in-8x' };
const error = (reason: string) => ({ outcome: 'error', failure: { reason } });
const managed = value({
  serverless: {
    cloud: 'aws',
    region: 'us-east-1',
    readCapacity: capacity,
    sourceCollection: undefined,
  },
});
const embed = (model: string, metric?: string, dimension?: number) =>
  value({
    model,
    metric,
    dimension,
    fieldMap: { text: 'chunk_text' },
    readParameters: undefined,
    writeParameters: undefined,
  });
const classic = [value(1536), value('cosine'), value('dense'), managed, absent];
const novel = [
  error('novel-shape'),
  error('novel-shape'),
  error('novel-shape'),
  managed,
  absent,
];
const expectations = {
  classicDense: classic,
  classicSparse: [
    absent,
    value('dotproduct'),
    value('sparse'),
    managed,
    absent,
  ],
  namedDense: [
    value(768),
    value('dotproduct'),
    value('dense'),
    managed,
    absent,
  ],
  namedSparse: [
    error('novel-shape'),
    error('novel-shape'),
    value('sparse'),
    managed,
    absent,
  ],
  classicDenseWithLegacyMetadata: [
    value(1024),
    value('dotproduct'),
    value('dense'),
    managed,
    absent,
  ],
  genuineHybridNamed: [
    value(8),
    value('euclidean'),
    error('ambiguous'),
    managed,
    absent,
  ],
  mixedReservedAndNamed: [
    error('unproducible-response'),
    error('unproducible-response'),
    error('unproducible-response'),
    managed,
    absent,
  ],
  twoDense: [
    error('ambiguous'),
    error('ambiguous'),
    error('ambiguous'),
    managed,
    absent,
  ],
  twoSparse: [
    error('novel-shape'),
    error('ambiguous'),
    error('ambiguous'),
    managed,
    absent,
  ],
  integratedWithMetric: [
    error('not-reported-by-api'),
    value('cosine'),
    error('not-reported-by-api'),
    managed,
    embed('multilingual-e5-large', 'cosine'),
  ],
  integratedNoMetric: [
    error('not-reported-by-api'),
    error('not-reported-by-api'),
    error('not-reported-by-api'),
    managed,
    embed('llama-text-embed-v2'),
  ],
  fullTextOnly: novel,
  documentsMetadataOnly: novel,
  declaredPlusServerAdded: classic,
  denseWithUntyped: classic,
  untypedOnly: novel,
  emptySchema: novel,
  podFull: [
    ...classic.slice(0, 3),
    value({
      pod: {
        environment: 'us-east1-gcp',
        podType: 'p1.x1',
        replicas: 2,
        shards: 2,
        pods: 4,
        sourceCollection: undefined,
      },
    }),
    absent,
  ],
  podPartial: [
    ...classic.slice(0, 3),
    value({
      pod: {
        environment: 'us-east1-gcp',
        podType: 'p1.x1',
        replicas: 2,
        shards: undefined,
        pods: undefined,
        sourceCollection: undefined,
      },
    }),
    absent,
  ],
  byoc: [
    ...classic.slice(0, 3),
    value({
      byoc: { environment: 'aws-us-east-1-b921', readCapacity: capacity },
    }),
    absent,
  ],
  managedWithEnvironment: [value(768), ...classic.slice(1)],
  initializing: [
    error('still-initializing'),
    error('still-initializing'),
    error('still-initializing'),
    managed,
    absent,
  ],
  unknownDeploymentType: [...classic.slice(0, 3), value({}), absent],
  managedMissingReadCapacity: [
    ...classic.slice(0, 3),
    value({
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
        readCapacity: undefined,
        sourceCollection: undefined,
      },
    }),
    absent,
  ],
  integratedReportedDimension: [
    value(1024),
    value('cosine'),
    error('not-reported-by-api'),
    managed,
    embed('dense-model', 'cosine', 1024),
  ],
  integratedSparseDimension: [
    absent,
    error('not-reported-by-api'),
    error('not-reported-by-api'),
    managed,
    embed('sparse-model'),
  ],
  reservedWithSemantic: [
    ...classic.slice(0, 4),
    embed('dense-model', 'cosine', 1536),
  ],
};

function outcome(result: Derived<unknown>) {
  return result.outcome === 'error' ? error(result.failure.reason) : result;
}

describe('pure legacy index derivations', () => {
  test('every fixture has all five property expectations', () => {
    expect(Object.keys(fixtures)).toEqual(Object.keys(expectations));
    Object.values(expectations).forEach((row) => expect(row).toHaveLength(5));
  });
  for (const [name, fixture] of Object.entries(fixtures)) {
    const methods = [
      deriveDimension,
      deriveMetric,
      deriveVectorType,
      deriveSpec,
      deriveEmbed,
    ];
    methods.forEach((method, position) =>
      test(`${name}: ${method.name}`, () => {
        const before = structuredClone(fixture);
        expect(outcome(method(fixture))).toEqual(expectations[name][position]);
        expect(fixture).toStrictEqual(before);
      }),
    );
  }
  test('reserved co-reported sparse field does not make a classic dense index ambiguous', () => {
    expect([...RESERVED_VECTOR_FIELD_NAMES]).toEqual([
      '_values',
      '_sparse_values',
    ]);
    expect(classifyIndexShape(fixtures.classicDense)).toBe('vectors-api');
    expect(classifyIndexShape(fixtures.classicDenseWithLegacyMetadata)).toBe(
      'vectors-api',
    );
    expect(classifyIndexShape(fixtures.classicSparse)).toBe('vectors-api');
    expect(classifyIndexShape(fixtures.namedSparse)).toBe('documents-api');
    expect(classifyIndexShape(fixtures.genuineHybridNamed)).toBe(
      'documents-api',
    );
    expect(classifyIndexShape(fixtures.mixedReservedAndNamed)).toBe(
      'indeterminate',
    );
    expect(classifyIndexShape(fixtures.reservedWithSemantic)).toBe(
      'vectors-api',
    );
  });
  test('the pure module exposes only synchronous derivations and formatting', () => {
    expect(Object.keys(pureAccessors).sort()).toEqual([
      'classifyIndexShape',
      'deriveDimension',
      'deriveEmbed',
      'deriveLegacyReadCapacity',
      'deriveMetric',
      'deriveSpec',
      'deriveVectorType',
      'formatDeriveFailure',
    ]);
  });
});

test('derives reported model settings from a live 2026-07 createForModel schema', () => {
  // Observed on 2026-09-09 from createForModel and describe using
  // multilingual-e5-large. This verifies the new API path, not a v8-created index.
  const model = {
    ...fixtures.integratedReportedDimension,
    schema: {
      fields: {
        chunk_text: {
          type: 'semantic_text' as const,
          model: 'multilingual-e5-large',
          dimension: 1024,
          metric: 'cosine',
          writeParameters: { input_type: 'passage', truncate: 'END' },
          readParameters: { input_type: 'query', truncate: 'END' },
        },
      },
    },
  };
  expect(deriveDimension(model)).toEqual(value(1024));
  expect(deriveMetric(model)).toEqual(value('cosine'));
  expect(deriveEmbed(model)).toEqual(
    value({
      model: 'multilingual-e5-large',
      dimension: 1024,
      metric: 'cosine',
      fieldMap: { text: 'chunk_text' },
      writeParameters: { input_type: 'passage', truncate: 'END' },
      readParameters: { input_type: 'query', truncate: 'END' },
    }),
  );
  expect(deriveVectorType(model)).toMatchObject(error('not-reported-by-api'));
});
