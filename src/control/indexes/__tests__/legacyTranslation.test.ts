import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { Pinecone } from '../../../index';
import {
  specToDeployment,
  specToReadCapacity,
  legacyVectorSchema,
  legacyPodScaling,
  translateLegacyCreateOptions,
  translateLegacyConfigureOptions,
} from '../legacyTranslation';
import {
  CreateIndexRequestFromJSON,
  CreateIndexRequestToJSON,
  ManageIndexesApi,
} from '../../../pinecone-generated-ts-fetch/db_control';
import { createIndex, CreateIndexOptions } from '../createIndex';
import { configureIndex, ConfigureIndexOptions } from '../configureIndex';
import { PineconeArgumentError } from '../../../errors';

const spec = { serverless: { cloud: 'aws', region: 'us-east-1' } };
const nativeCapacity = {
  mode: 'Dedicated' as const,
  dedicated: {
    nodeType: 'b1' as const,
    scaling: 'Manual',
    manual: { replicas: 2, shards: 1 },
  },
};
const flatCapacity = {
  nodeType: 'b1' as const,
  manual: { replicas: 2, shards: 1 },
};

describe('legacy index translation', () => {
  test.each(['cosine', 'euclidean', 'dotproduct'] as const)(
    'preserves dense %s metric and selects the vectors API',
    (metric) => {
      expect(legacyVectorSchema({ dimension: 8, metric })).toEqual({
        fields: { _values: { type: 'dense_vector', dimension: 8, metric } },
      });
    },
  );
  test('defaults dense metric and omits sparse metric', () => {
    expect(legacyVectorSchema({ dimension: 8 })).toEqual({
      fields: {
        _values: { type: 'dense_vector', dimension: 8, metric: 'cosine' },
      },
    });
    expect(
      legacyVectorSchema({ vectorType: 'sparse', metric: 'dotproduct' }),
    ).toEqual({ fields: { _sparse_values: { type: 'sparse_vector' } } });
    expect(legacyVectorSchema({ vectorType: 'sparse' })).toEqual({
      fields: { _sparse_values: { type: 'sparse_vector' } },
    });
  });
  test('maps deployment independently of lifted capacity', () => {
    expect(
      specToDeployment({
        serverless: { ...spec.serverless, readCapacity: flatCapacity },
      }),
    ).toEqual({ deploymentType: 'managed', cloud: 'aws', region: 'us-east-1' });
    expect(
      specToDeployment({
        byoc: { environment: 'private', readCapacity: nativeCapacity },
      }),
    ).toEqual({ deploymentType: 'byoc', environment: 'private' });
    expect(specToReadCapacity(spec)).toBeUndefined();
  });
  test.each([
    flatCapacity,
    { ...flatCapacity, mode: 'Dedicated' },
    nativeCapacity,
  ])('lifts and independently copies capacity %p', (readCapacity) => {
    const input = { serverless: { ...spec.serverless, readCapacity } };
    const original = structuredClone(input);
    const result = specToReadCapacity(input);
    expect(result).toEqual(nativeCapacity);
    if (result?.mode === 'Dedicated') result.dedicated.manual.replicas = 9;
    expect(input).toEqual(original);
  });
  test('honors explicit capacity over the spec', () => {
    expect(
      translateLegacyCreateOptions({
        name: 'index',
        dimension: 8,
        spec: {
          serverless: { ...spec.serverless, readCapacity: flatCapacity },
        },
        readCapacity: { mode: 'OnDemand' },
      }).readCapacity,
    ).toEqual({ mode: 'OnDemand' });
  });
  test('accepts explicit dedicated capacity for BYOC', () => {
    expect(
      translateLegacyCreateOptions({
        name: 'index',
        dimension: 8,
        spec: { byoc: { environment: 'private' } },
        readCapacity: flatCapacity,
      }),
    ).toEqual({
      name: 'index',
      schema: legacyVectorSchema({ dimension: 8 }),
      deployment: { deploymentType: 'byoc', environment: 'private' },
      readCapacity: nativeCapacity,
    });
  });
  test.each([
    [{}, {}],
    [{ podReplicas: 4 }, { replicas: 4 }],
    [{ podType: 'p1.x2' }, { podType: 'p1.x2' }],
    [
      { podReplicas: 4, podType: 'p1.x2' },
      { replicas: 4, podType: 'p1.x2' },
    ],
    [{ podReplicas: undefined, podType: undefined }, {}],
  ])('emits only supplied pod scaling fields %p', (input, expected) => {
    const result = legacyPodScaling(input);
    expect(result).toEqual(expected);
    expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
  });
  test('translates the old flat configure read capacity', () => {
    expect(
      translateLegacyConfigureOptions({
        podReplicas: 2,
        tags: {},
        readCapacity: flatCapacity,
      }),
    ).toEqual({
      deployment: { replicas: 2 },
      tags: {},
      readCapacity: nativeCapacity,
    });
  });

  test('boundary dimensions and all metrics preserve wire parity and input immutability', () => {
    for (const dimension of [1, 2, 8, 1536, 19999, 20000]) {
      for (const metric of ['cosine', 'dotproduct', 'euclidean'] as const) {
        const input = {
          name: 'vectors',
          dimension,
          metric,
          spec,
          tags: { team: 'search' },
        };
        const original = structuredClone(input);
        const translated = translateLegacyCreateOptions(input);
        const native = {
          name: 'vectors',
          schema: {
            fields: {
              _values: { type: 'dense_vector' as const, dimension, metric },
            },
          },
          deployment: {
            deploymentType: 'managed' as const,
            cloud: 'aws',
            region: 'us-east-1',
          },
          tags: { team: 'search' },
        };
        const wire = CreateIndexRequestToJSON(translated);
        expect(JSON.stringify(wire)).toBe(
          JSON.stringify(CreateIndexRequestToJSON(native)),
        );
        expect(
          CreateIndexRequestToJSON(CreateIndexRequestFromJSON(wire)),
        ).toEqual(wire);
        expect(JSON.parse(JSON.stringify(translated))).toStrictEqual(
          translated,
        );
        expect(Object.keys(translated.schema.fields)).toEqual(['_values']);
        expect(input).toEqual(original);
      }
    }
  });
  test('native options are unchanged and copied', () => {
    const input = {
      name: 'docs',
      schema: {
        fields: { body: { type: 'string' as const, fullTextSearch: {} } },
      },
      readCapacity: nativeCapacity,
    };
    expect(translateLegacyCreateOptions(input)).toEqual(input);
    expect(translateLegacyCreateOptions(input)).not.toBe(input);
  });

  test('the translation module only imports types, constants and validation errors', () => {
    const source = readFileSync(
      require.resolve('../legacyTranslation'),
      'utf8',
    );
    const allowed = [
      '../../errors',
      '../types',
      '../../pinecone-generated-ts-fetch/db_control',
      './createIndex',
      './configureIndex',
      './legacyConstants',
    ];
    for (const file of ts.preProcessFile(source).importedFiles)
      expect(allowed).toContain(file.fileName);
    const ast = ts.createSourceFile(
      'legacyTranslation.ts',
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of ast.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        !['../../errors', '../types', './legacyConstants'].includes(
          statement.moduleSpecifier.text,
        )
      ) {
        expect(statement.importClause?.isTypeOnly).toBe(true);
      }
    }
  });
});

describe('legacy create validation', () => {
  test.each([
    [null, 'You must pass an object for index creation options.'],
    [{}, 'You must pass an object for `spec`.'],
    [
      { dimension: 8, schema: { fields: {} } },
      'Cannot mix 2026-07 options (schema) with deprecated options (dimension). Use schema and deployment, or dimension/metric/vectorType/spec. See MIGRATION.md',
    ],
    [
      { dimension: 8, spec, metrics: 'cosine' },
      'Unknown option(s) in pc.indexes.create(): metrics.',
    ],
    [
      { dimension: 8, spec: {} },
      '`spec` must contain exactly one of `serverless`, `pod`, or `byoc`.',
    ],
    [
      { dimension: 8, spec: { serverless: null } },
      'You must pass an object for spec.serverless.',
    ],
    [
      { dimension: 8, spec: { serverless: { cloud: 'aws' } } },
      'You must pass a non-empty string for `region` in spec.serverless.',
    ],
    [
      {
        dimension: 8,
        spec: { serverless: { ...spec.serverless, typo: true } },
      },
      'Unknown option(s) in spec.serverless: typo.',
    ],
    [
      { dimension: 8, spec: { byoc: { environment: 'private' } } },
      'BYOC indexes require an explicit readCapacity of mode Dedicated.',
    ],
  ])('rejects invalid create options %p', (input, message) => {
    const options =
      input === null ? null : { name: 'index', dimension: 8, ...input };
    expect(() =>
      translateLegacyCreateOptions(options as CreateIndexOptions),
    ).toThrow(new PineconeArgumentError(message));
  });
  test.each([
    [
      { metric: 'manhattan', dimension: -1 },
      "Invalid metric value: manhattan. Valid values are: 'cosine', 'euclidean', or 'dotproduct'.",
    ],
    [
      { vectorType: 'SPARSE' },
      'Invalid `vectorType` value. Valid values are `dense` or `sparse`.',
    ],
    [
      { vectorType: 'sparse', dimension: 8 },
      'Sparse indexes cannot have a `dimension`.',
    ],
    [
      { vectorType: 'sparse', metric: 'cosine' },
      'Sparse indexes must have a `metric` of `dotproduct`.',
    ],
    [{}, 'You must pass a positive `dimension` when creating a dense index.'],
    ...[0, -1, 1.5, NaN, Infinity, '1536'].map(
      (dimension): [unknown, string] => [
        { dimension },
        'You must pass a positive integer for `dimension` in order to create an index.',
      ],
    ),
    [
      { dimension: 20001 },
      'You must pass a `dimension` of 20000 or less in order to create an index.',
    ],
  ])('rejects invalid vector parameters %p', (input, message) => {
    expect(() =>
      legacyVectorSchema(input as Parameters<typeof legacyVectorSchema>[0]),
    ).toThrow(new PineconeArgumentError(message as string));
  });
  test.each([
    [
      { pod: { environment: 'old', podType: 'p1.x1' } },
      'Pod-based indexes cannot be created',
    ],
    [{ integrated: {} }, 'Use pc.indexes.createForModel'],
    [
      { serverless: { ...spec.serverless, schema: {} } },
      'legacy metadata schema',
    ],
    [
      { serverless: { ...spec.serverless, sourceCollection: 'source' } },
      'Use pc.backups.createIndex(backupId, { name })',
    ],
  ])(
    'provides a migration path for untranslatable spec %p',
    (invalidSpec, message) => {
      expect(() =>
        translateLegacyCreateOptions({
          name: 'index',
          vectorType: 'sparse',
          spec: invalidSpec,
        } as CreateIndexOptions),
      ).toThrow(message);
    },
  );
  test.each(['sourceCollection', 'sourceBackupId'])(
    'rejects %s with the actual backup API name',
    (key) => {
      expect(() =>
        translateLegacyCreateOptions({
          name: 'index',
          dimension: 8,
          spec,
          [key]: 'source',
        }),
      ).toThrow('Use pc.backups.createIndex(backupId, { name })');
    },
  );
});

describe('legacy read capacity validation', () => {
  test.each([
    [null, 'You must pass an object for `readCapacity`.'],
    [{ mode: 'Invalid' }, 'readCapacity.mode must be OnDemand or Dedicated.'],
    [
      { mode: 'OnDemand', ...flatCapacity },
      'Dedicated read capacity settings require mode Dedicated.',
    ],
    [
      { nodeType: 'p1', manual: { replicas: 1, shards: 1 } },
      'readCapacity.nodeType must be b1 or t1.',
    ],
    [{ nodeType: 'b1' }, 'You must pass an object for readCapacity.manual.'],
    [
      { nodeType: 'b1', manual: { replicas: -1, shards: 1 } },
      'readCapacity.manual requires non-negative integer replicas and positive integer shards.',
    ],
    [
      { nodeType: 'b1', manual: { replicas: 1, shards: 0 } },
      'readCapacity.manual requires non-negative integer replicas and positive integer shards.',
    ],
    [
      { ...flatCapacity, dedicated: {} },
      'Unknown option(s) in readCapacity: dedicated.',
    ],
  ])('rejects malformed legacy capacity %p', (readCapacity, message) => {
    expect(() =>
      translateLegacyConfigureOptions({
        readCapacity,
      } as ConfigureIndexOptions),
    ).toThrow(new PineconeArgumentError(message));
  });
  test('preserves native partial dedicated capacity settings', () => {
    const readCapacity = {
      mode: 'Dedicated' as const,
      dedicated: { manual: { replicas: 2 } },
    };
    expect(translateLegacyConfigureOptions({ readCapacity })).toEqual({
      readCapacity,
    });
  });
  test('preserves zero replicas used to disable dedicated reads', () => {
    expect(
      translateLegacyConfigureOptions({
        readCapacity: { nodeType: 'b1', manual: { replicas: 0, shards: 1 } },
      }).readCapacity,
    ).toEqual({
      mode: 'Dedicated',
      dedicated: {
        nodeType: 'b1',
        scaling: 'Manual',
        manual: { replicas: 0, shards: 1 },
      },
    });
  });
});

describe('legacy configure validation', () => {
  test.each([
    [{}, 'You must pass at least one configuration option to configureIndex.'],
    [{ podReplicas: 0 }, 'You must pass a positive integer for `podReplicas`.'],
    [
      { podReplicas: 1.5 },
      'You must pass a positive integer for `podReplicas`.',
    ],
    [
      { deployment: { replicas: 2 }, podReplicas: 3 },
      'Cannot mix deployment with deprecated podReplicas or podType.',
    ],
    [
      { name: 'other', tags: {} },
      'pc.indexes.configure() takes the index name as its first argument. Remove name from the options object.',
    ],
    [
      { spec: {} },
      'spec is not a configurable field. Use podReplicas/podType or readCapacity.',
    ],
    [{ replicas: 2 }, 'Use podReplicas to rescale an existing pod index.'],
    [
      { embed: {} },
      'Converting an existing index to integrated embedding is not supported on 2026-07. Use pc.indexes.createForModel(). See MIGRATION.md',
    ],
  ])('rejects invalid patch %p', (input, message) => {
    expect(() =>
      translateLegacyConfigureOptions(input as ConfigureIndexOptions),
    ).toThrow(new PineconeArgumentError(message));
  });
});

describe('legacy wrapper wiring', () => {
  test('create strips old keys and client-only options from the request', async () => {
    const request = jest.fn().mockResolvedValue({ name: 'index' });
    const api = { createIndex: request } as unknown as ManageIndexesApi;
    await createIndex(api, {
      name: 'index',
      dimension: 8,
      spec,
      timeout: 10,
      waitUntilReady: false,
      suppressConflicts: true,
    });
    expect(request).toHaveBeenCalledWith({
      createIndexRequest: {
        name: 'index',
        schema: legacyVectorSchema({ dimension: 8 }),
        deployment: specToDeployment(spec),
      },
      xPineconeApiVersion: '2026-07',
    });
  });
  test('configure sends only translated scaling without a describe request', async () => {
    const request = jest.fn().mockResolvedValue({ name: 'index' });
    const api = { configureIndex: request } as unknown as ManageIndexesApi;
    await configureIndex(api, 'index', { podReplicas: 2, podType: 'p1.x2' });
    expect(request).toHaveBeenCalledWith({
      indexName: 'index',
      configureIndexRequest: { deployment: { replicas: 2, podType: 'p1.x2' } },
      xPineconeApiVersion: '2026-07',
    });
  });
});

// Compile-only consumer examples: kept inside a function to avoid API calls.
function publicTypes(pc: Pinecone) {
  pc.createIndex({ name: 'classic', dimension: 8, spec });
  pc.indexes.create({ name: 'sparse', vectorType: 'sparse', spec });
  pc.configureIndex({
    name: 'classic',
    podReplicas: 2,
    readCapacity: flatCapacity,
  });
  pc.indexes.configure('classic', { podType: 'p1.x2' });
  // @ts-expect-error Legacy vector keys and native schema must not be mixed.
  pc.indexes.create({ name: 'mixed', dimension: 8, schema: { fields: {} } });
  // @ts-expect-error Legacy dimensions must be numbers.
  pc.createIndex({ name: 'bad', dimension: '8', spec });
  // @ts-expect-error A legacy deployment cannot be mixed with native schema.
  pc.createIndex({ name: 'mixed', schema: { fields: {} }, spec });
}
void publicTypes;
