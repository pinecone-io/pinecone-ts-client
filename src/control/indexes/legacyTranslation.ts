import { PineconeArgumentError } from '../../errors';
import { ValidPodTypes } from '../types';
import type { IndexMetric, ReadCapacity } from '../types';
import type {
  IndexDeploymentRequest,
  PatchIndexDeploymentRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import type {
  CreateIndexOptions,
  NativeCreateIndexOptions,
  CreateIndexSchema,
} from './createIndex';
import type {
  ConfigureIndexOptions,
  NativeConfigureIndexOptions,
} from './configureIndex';
import {
  RESERVED_DENSE_VECTOR_FIELD,
  RESERVED_SPARSE_VECTOR_FIELD,
} from './legacyConstants';

const GUIDE = 'MIGRATION.md';
function fail(message: string): never {
  throw new PineconeArgumentError(message);
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
function object(value: unknown, name: string): Record<string, unknown> {
  if (!isObject(value)) return fail(`You must pass an object for ${name}.`);
  return value;
}
function unknownKeys(
  value: Record<string, unknown>,
  allowed: string[],
  name: string,
) {
  const keys = Object.keys(value).filter((key) => !allowed.includes(key));
  if (keys.length)
    fail(`Unknown option(s) in ${name}: ${keys.sort().join(', ')}.`);
}
function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T;
  if (isObject(value))
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clone(v)]),
    ) as T;
  return value;
}
function requiredString(value: unknown, key: string): string {
  if (typeof value !== 'string' || !value.trim())
    fail(`You must pass a non-empty string for ${key}.`);
  return value as string;
}
function unsupportedSource() {
  return fail(
    `Creating an index from a collection or backup is not supported by pc.indexes.create() on 2026-07. Use pc.backups.createIndex(backupId, { name }) to restore a backup. See ${GUIDE}`,
  );
}
function specPart(spec: unknown) {
  const outer = object(spec, '`spec`');
  if ('integrated' in outer)
    fail(
      `spec.integrated is not supported. Use pc.indexes.createForModel({ name, model, field, deployment }). See ${GUIDE}`,
    );
  const keys = Object.keys(outer);
  if (keys.length !== 1 || !['serverless', 'byoc', 'pod'].includes(keys[0]))
    fail('`spec` must contain exactly one of `serverless`, `pod`, or `byoc`.');
  const kind = keys[0];
  if (kind === 'pod')
    fail(
      `Pod-based indexes cannot be created on the 2026-07 API. Existing pod indexes can still be queried and rescaled with pc.indexes.configure(name, { podReplicas, podType }). Use spec.serverless to create a serverless index. See ${GUIDE}`,
    );
  const inner = object(outer[kind], `spec.${kind}`);
  if ('sourceCollection' in inner || 'sourceBackupId' in inner)
    unsupportedSource();
  if ('schema' in inner || 'metadataConfig' in inner)
    fail(
      `The legacy metadata schema in spec.${kind} cannot be translated to the searchable-field schema on 2026-07. Remove the metadata schema; metadata is indexed automatically. See ${GUIDE}`,
    );
  unknownKeys(
    inner,
    kind === 'serverless'
      ? ['cloud', 'region', 'readCapacity']
      : ['environment', 'readCapacity'],
    `spec.${kind}`,
  );
  return { kind, inner };
}

/** Translate a legacy deployment without performing a control-plane request. */
export function specToDeployment(spec: unknown): IndexDeploymentRequest {
  const { kind, inner } = specPart(spec);
  if (kind === 'serverless')
    return {
      deploymentType: 'managed',
      cloud: requiredString(inner.cloud, '`cloud` in spec.serverless'),
      region: requiredString(inner.region, '`region` in spec.serverless'),
    };
  return {
    deploymentType: 'byoc',
    environment: requiredString(
      inner.environment,
      '`environment` in spec.byoc',
    ),
  };
}

function readCapacity(value: unknown): ReadCapacity | undefined {
  if (value === undefined) return undefined;
  const input = object(value, '`readCapacity`');
  const flat = 'nodeType' in input || 'manual' in input;
  const mode = input.mode ?? (flat ? 'Dedicated' : 'OnDemand');
  if (mode !== 'OnDemand' && mode !== 'Dedicated')
    fail('readCapacity.mode must be OnDemand or Dedicated.');
  if (flat) {
    unknownKeys(input, ['mode', 'nodeType', 'manual'], 'readCapacity');
    if (mode !== 'Dedicated')
      fail('Dedicated read capacity settings require mode Dedicated.');
    if (!['b1', 't1'].includes(input.nodeType as string))
      fail('readCapacity.nodeType must be b1 or t1.');
    const manual = object(input.manual, 'readCapacity.manual');
    unknownKeys(manual, ['replicas', 'shards'], 'readCapacity.manual');
    if (
      !Number.isInteger(manual.replicas) ||
      (manual.replicas as number) < 0 ||
      !Number.isInteger(manual.shards) ||
      (manual.shards as number) < 1
    )
      fail(
        'readCapacity.manual requires non-negative integer replicas and positive integer shards.',
      );
    return {
      mode: 'Dedicated',
      dedicated: {
        nodeType: input.nodeType as 'b1' | 't1',
        scaling: 'Manual',
        manual: {
          replicas: manual.replicas as number,
          shards: manual.shards as number,
        },
      },
    };
  }
  // Native shapes remain the API's responsibility; do not narrow future native settings.
  return { ...clone(input), mode } as ReadCapacity;
}

/** Lift and copy read capacity from the legacy deployment spec. */
export function specToReadCapacity(spec: unknown): ReadCapacity | undefined {
  return readCapacity(specPart(spec).inner.readCapacity);
}

/** Construct exactly one reserved vector field for the vectors API. */
export function legacyVectorSchema(args: {
  dimension?: number;
  metric?: string;
  vectorType?: string;
}): CreateIndexSchema {
  const { dimension, metric, vectorType = 'dense' } = args;
  if (
    metric !== undefined &&
    !['cosine', 'euclidean', 'dotproduct'].includes(metric)
  )
    fail(
      `Invalid metric value: ${metric}. Valid values are: 'cosine', 'euclidean', or 'dotproduct'.`,
    );
  if (vectorType !== 'dense' && vectorType !== 'sparse')
    fail('Invalid `vectorType` value. Valid values are `dense` or `sparse`.');
  if (vectorType === 'sparse') {
    if (dimension !== undefined)
      fail('Sparse indexes cannot have a `dimension`.');
    if (metric !== undefined && metric !== 'dotproduct')
      fail('Sparse indexes must have a `metric` of `dotproduct`.');
    return {
      fields: { [RESERVED_SPARSE_VECTOR_FIELD]: { type: 'sparse_vector' } },
    };
  }
  if (dimension === undefined)
    fail('You must pass a positive `dimension` when creating a dense index.');
  if (
    typeof dimension !== 'number' ||
    !Number.isInteger(dimension) ||
    dimension < 1
  )
    fail(
      'You must pass a positive integer for `dimension` in order to create an index.',
    );
  if (dimension > 20000)
    fail(
      'You must pass a `dimension` of 20000 or less in order to create an index.',
    );
  return {
    fields: {
      [RESERVED_DENSE_VECTOR_FIELD]: {
        type: 'dense_vector',
        dimension,
        metric: (metric ?? 'cosine') as IndexMetric,
      },
    },
  };
}

/** Translate legacy pod scaling into a sparse PATCH deployment. */
export function legacyPodScaling(args: {
  podReplicas?: number;
  podType?: string;
}): PatchIndexDeploymentRequest {
  const deployment: PatchIndexDeploymentRequest = {};
  if (args.podReplicas !== undefined) {
    if (!Number.isInteger(args.podReplicas) || args.podReplicas < 1)
      fail('You must pass a positive integer for `podReplicas`.');
    deployment.replicas = args.podReplicas;
  }
  if (args.podType !== undefined) {
    if (!ValidPodTypes.includes(args.podType as (typeof ValidPodTypes)[number]))
      fail(
        `Invalid pod type: ${args.podType}. Valid values are: ${ValidPodTypes.join(', ')}.`,
      );
    deployment.podType = args.podType;
  }
  return deployment;
}

/** Normalize either public create shape without changing the caller's object. */
export function translateLegacyCreateOptions(
  options: CreateIndexOptions,
): NativeCreateIndexOptions {
  const input = object(options, 'index creation options');
  if ('sourceCollection' in input || 'sourceBackupId' in input)
    unsupportedSource();
  const legacyKeys = ['dimension', 'metric', 'vectorType', 'spec'].filter(
    (k) => input[k] !== undefined,
  );
  const nativeKeys = ['schema', 'deployment'].filter(
    (k) => input[k] !== undefined,
  );
  if (legacyKeys.length && nativeKeys.length)
    fail(
      `Cannot mix 2026-07 options (${nativeKeys.sort().join(', ')}) with deprecated options (${legacyKeys.sort().join(', ')}). Use schema and deployment, or dimension/metric/vectorType/spec. See ${GUIDE}`,
    );
  unknownKeys(
    input,
    [
      'name',
      'schema',
      'deployment',
      'readCapacity',
      'deletionProtection',
      'tags',
      'cmekId',
      'waitUntilReady',
      'timeout',
      'suppressConflicts',
      'dimension',
      'metric',
      'vectorType',
      'spec',
    ],
    'pc.indexes.create()',
  );
  if (!legacyKeys.length) return clone(options) as NativeCreateIndexOptions;
  const deployment = specToDeployment(input.spec);
  const schema = legacyVectorSchema(options);
  const capacity =
    input.readCapacity !== undefined
      ? readCapacity(input.readCapacity)
      : specToReadCapacity(input.spec);
  if (deployment.deploymentType === 'byoc' && capacity?.mode !== 'Dedicated')
    fail('BYOC indexes require an explicit readCapacity of mode Dedicated.');
  const rest = Object.fromEntries(
    Object.entries(input).filter(
      ([key]) =>
        !['dimension', 'metric', 'vectorType', 'spec', 'readCapacity'].includes(
          key,
        ),
    ),
  );
  const result = {
    ...clone(rest),
    schema,
    deployment,
  } as NativeCreateIndexOptions;
  if (capacity !== undefined) result.readCapacity = capacity;
  return result;
}

/** Normalize legacy pod scaling and flat read capacity without a describe call. */
export function translateLegacyConfigureOptions(
  options: ConfigureIndexOptions,
): NativeConfigureIndexOptions {
  if (options == null)
    fail('You must pass at least one configuration option to configureIndex.');
  const input = object(options, 'index configuration options');
  if ('name' in input)
    fail(
      'pc.indexes.configure() takes the index name as its first argument. Remove name from the options object.',
    );
  if ('embed' in input)
    fail(
      `Converting an existing index to integrated embedding is not supported on 2026-07. Use pc.indexes.createForModel(). See ${GUIDE}`,
    );
  if ('spec' in input)
    fail(
      'spec is not a configurable field. Use podReplicas/podType or readCapacity.',
    );
  if ('replicas' in input)
    fail('Use podReplicas to rescale an existing pod index.');
  unknownKeys(
    input,
    [
      'deployment',
      'schema',
      'readCapacity',
      'tags',
      'deletionProtection',
      'podReplicas',
      'podType',
    ],
    'pc.indexes.configure()',
  );
  const hasPod = input.podReplicas !== undefined || input.podType !== undefined;
  if (hasPod && input.deployment !== undefined)
    fail('Cannot mix deployment with deprecated podReplicas or podType.');
  const capacity = input.readCapacity;
  const rest = Object.fromEntries(
    Object.entries(input).filter(
      ([key]) => !['podReplicas', 'podType', 'readCapacity'].includes(key),
    ),
  );
  const result = clone(rest) as NativeConfigureIndexOptions;
  if (hasPod) result.deployment = legacyPodScaling(options);
  if (capacity !== undefined) result.readCapacity = readCapacity(capacity);
  if (!Object.keys(result).length)
    fail('You must pass at least one configuration option to configureIndex.');
  return result;
}
