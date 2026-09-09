import type { IndexModelData, ReadCapacityResponse } from './listIndexes';
import { RESERVED_VECTOR_FIELD_NAMES } from './legacyConstants';

/** Why a legacy property cannot be obtained from an index response. */
export type DeriveFailureReason =
  | 'novel-shape'
  | 'ambiguous'
  | 'not-reported-by-api'
  | 'unproducible-response'
  | 'still-initializing';
/** Classification of the vector fields reported by the API. */
export type IndexShape = 'vectors-api' | 'documents-api' | 'indeterminate';
/** Structured context for an unavailable legacy property. */
export interface DeriveFailure {
  /** Stable cause of the unavailable property. */
  reason: DeriveFailureReason;
  /** Response context used to explain the failure. */
  detail: {
    /** The legacy property requested. */
    property: string;
    /** The index name. */
    indexName: string;
    /** Which API the vector field names identify. */
    servedBy: IndexShape;
    /** Schema fields and reported model settings. */
    fields: Array<{
      /** Schema field name. */
      name: string;
      /** Schema field discriminator, or untyped legacy field. */
      type: string;
      /** Reported vector dimension; null denotes a sparse model. */
      dimension?: number | null;
      /** Reported similarity metric. */
      metric?: string;
      /** Integrated embedding model identifier. */
      model?: string;
    }>;
    /** Deployment discriminator reported by the API. */
    deploymentType: string;
    /** Index lifecycle state. */
    state: string;
  };
}
/** A legacy property value, normal absence, or a reason it cannot be derived. */
export type Derived<T> =
  | {
      /** Successful derivation. */ outcome: 'value';
      /** Derived property. */ value: T;
    }
  | {
      /** Normal optional absence. */ outcome: 'absent';
      /** Legacy absence semantics. */ because: 'inapplicable-in-8x';
    }
  | {
      /** Unavailable property. */ outcome: 'error';
      /** Explanation and response context. */ failure: DeriveFailure;
    };
/** Legacy serverless deployment information. */
export interface LegacyServerlessSpec {
  /** Cloud provider hosting the index. */
  cloud: string;
  /** Cloud region hosting the index. */
  region: string;
  /** The read capacity object reported by the API. */
  readCapacity: ReadCapacityResponse;
  /** Collection from which this index was created. */
  sourceCollection?: string;
  /** Unavailable: the old metadata schema cannot be inferred from the searchable-field schema. */
  schema?: undefined;
}
/** Legacy BYOC deployment information. */
export interface LegacyByocSpec {
  /** Deployment environment. */
  environment: string;
  /** The read capacity object reported by the API. */
  readCapacity: ReadCapacityResponse;
  /** Unavailable: the old metadata schema cannot be inferred from the searchable-field schema. */
  schema?: undefined;
}
/** Legacy pod deployment information. */
export interface LegacyPodSpec {
  /** Deployment environment. */
  environment: string;
  /** Pod size and family. */
  podType: string;
  /** Reported replica count. */
  replicas?: number;
  /** Reported shard count. */
  shards?: number;
  /** Replica count multiplied by shard count, when both are reported. */
  pods?: number;
  /** Collection from which this index was created. */
  sourceCollection?: string;
  /** Unavailable: metadata indexing configuration is not reported by this API. */
  metadataConfig?: undefined;
}
/** Pre-2026-07 deployment envelope. Only the applicable variant is present. */
export interface LegacyIndexSpec {
  /** Serverless deployment settings, when applicable. */
  serverless?: LegacyServerlessSpec;
  /** Pod deployment settings, when applicable. */
  pod?: LegacyPodSpec;
  /** BYOC deployment settings, when applicable. */
  byoc?: LegacyByocSpec;
}
/** Integrated embedding settings derived from a semantic text field. */
export interface LegacyIndexEmbed {
  /** Integrated embedding model identifier. */
  model: string;
  /** Reported similarity metric. */
  metric?: string;
  /** Reported vector dimension; null denotes a sparse model. */
  dimension?: number;
  /** The vector type, when reported by the model. */
  vectorType?: 'dense' | 'sparse';
  /** Maps the text input to its schema field. */
  fieldMap: {
    /** Schema field supplying text to the model. */
    text: string;
  };
  /** Model parameters applied at query time. */
  readParameters?: object | null;
  /** Model parameters applied at write time. */
  writeParameters?: object | null;
}
/** Non-enumerable compatibility properties on an SDK index response. */
export interface LegacyIndexProperties {
  /** @deprecated Read the dimension on the relevant schema field. */
  readonly dimension?: number;
  /** @deprecated Read the metric on the relevant schema field. */
  readonly metric: string;
  /** @deprecated Inspect the types of the schema fields. */
  readonly vectorType: 'dense' | 'sparse';
  /** @deprecated Read deployment and readCapacity. */
  readonly spec: LegacyIndexSpec;
  /** @deprecated Read the semantic_text schema field. */
  readonly embed?: LegacyIndexEmbed;
}

const entries = (model: IndexModelData) =>
  Object.entries(model.schema?.fields ?? {});
const typed = (model: IndexModelData) =>
  entries(model).flatMap(([name, field]) =>
    'type' in field ? [{ name, ...field }] : [],
  );
const vectors = (model: IndexModelData) =>
  typed(model).filter(
    (field) => field.type === 'dense_vector' || field.type === 'sparse_vector',
  );
const dense = (model: IndexModelData) =>
  typed(model).filter((field) => field.type === 'dense_vector');
const semantic = (model: IndexModelData) =>
  typed(model).filter((field) => field.type === 'semantic_text');
const value = <T>(result: T): Derived<T> => ({
  outcome: 'value',
  value: result,
});
const absent = { outcome: 'absent', because: 'inapplicable-in-8x' } as const;

/** Partition vector fields by reserved names; semantic and metadata fields do not affect it. */
export function classifyIndexShape(model: IndexModelData): IndexShape {
  const fields = vectors(model);
  if (fields.length === 0)
    return entries(model).length === 0 && !model.status.ready
      ? 'indeterminate'
      : 'documents-api';
  // The 2026-07 IndexSchema contract co-reports _sparse_values on classic dense indexes.
  const reserved = fields.filter((field) =>
    RESERVED_VECTOR_FIELD_NAMES.has(field.name),
  );
  return reserved.length === fields.length
    ? 'vectors-api'
    : reserved.length === 0
      ? 'documents-api'
      : 'indeterminate';
}
const failure = (
  model: IndexModelData,
  property: string,
  reason: DeriveFailureReason,
): { outcome: 'error'; failure: DeriveFailure } => ({
  outcome: 'error',
  failure: {
    reason,
    detail: {
      property,
      indexName: model.name,
      servedBy: classifyIndexShape(model),
      fields: entries(model).map(([name, field]) =>
        'type' in field
          ? { name, ...field }
          : { name, type: 'untyped legacy field' },
      ),
      deploymentType: model.deployment.deploymentType,
      state: model.status.state,
    },
  },
});
const unavailable = (model: IndexModelData, property: string) => {
  if (entries(model).length === 0 && !model.status.ready)
    return failure(model, property, 'still-initializing');
  if (classifyIndexShape(model) === 'indeterminate')
    return failure(model, property, 'unproducible-response');
};

/** Derive the dimension without throwing or mutating the response. */
export function deriveDimension(model: IndexModelData): Derived<number> {
  const bad = unavailable(model, 'dimension');
  if (bad) return bad;
  const fields = dense(model);
  if (fields.length === 1) return value(fields[0].dimension);
  if (fields.length > 1) return failure(model, 'dimension', 'ambiguous');
  if (classifyIndexShape(model) === 'vectors-api') return absent;
  const models = semantic(model);
  if (models.length === 1 && models[0].dimension !== undefined)
    return models[0].dimension === null ? absent : value(models[0].dimension);
  return failure(
    model,
    'dimension',
    models.length ? 'not-reported-by-api' : 'novel-shape',
  );
}
/** Derive the metric without inventing defaults for document indexes. */
export function deriveMetric(model: IndexModelData): Derived<string> {
  const bad = unavailable(model, 'metric');
  if (bad) return bad;
  const fields = dense(model);
  if (fields.length === 1) return value(fields[0].metric);
  if (fields.length > 1) return failure(model, 'metric', 'ambiguous');
  // v8 sparse indexes required dotproduct; it is a compatibility constant.
  if (classifyIndexShape(model) === 'vectors-api') return value('dotproduct');
  const models = semantic(model);
  if (models.length === 1 && models[0].metric !== undefined)
    return value(models[0].metric);
  return failure(
    model,
    'metric',
    models.length > 1 || vectors(model).length > 1
      ? 'ambiguous'
      : models.length
        ? 'not-reported-by-api'
        : 'novel-shape',
  );
}
/** Derive the vector type, treating the reserved dense/sparse pair as dense. */
export function deriveVectorType(
  model: IndexModelData,
): Derived<'dense' | 'sparse'> {
  const bad = unavailable(model, 'vectorType');
  if (bad) return bad;
  const fields = vectors(model);
  if (classifyIndexShape(model) === 'vectors-api')
    return value(dense(model).length ? 'dense' : 'sparse');
  if (fields.length === 1)
    return value(fields[0].type === 'dense_vector' ? 'dense' : 'sparse');
  return failure(
    model,
    'vectorType',
    fields.length > 1
      ? 'ambiguous'
      : semantic(model).length
        ? 'not-reported-by-api'
        : 'novel-shape',
  );
}
/** Reverse the deployment envelope; read capacity is the same object reported by the API. */
export function deriveSpec(model: IndexModelData): Derived<LegacyIndexSpec> {
  const deployment = model.deployment;
  // Legacy spec.schema means MetadataSchema, not the searchable-field schema.
  // Never populate that similarly named field from model.schema.
  if (deployment.deploymentType === 'managed')
    return value({
      serverless: {
        cloud: deployment.cloud,
        region: deployment.region,
        readCapacity: model.readCapacity as ReadCapacityResponse,
        sourceCollection: model.sourceCollection,
      },
    });
  if (deployment.deploymentType === 'byoc')
    return value({
      byoc: {
        environment: deployment.environment,
        readCapacity: model.readCapacity as ReadCapacityResponse,
      },
    });
  if (deployment.deploymentType === 'pod')
    return value({
      pod: {
        environment: deployment.environment,
        podType: deployment.podType,
        replicas: deployment.replicas,
        shards: deployment.shards,
        pods:
          deployment.replicas !== undefined && deployment.shards !== undefined
            ? deployment.replicas * deployment.shards
            : undefined,
        sourceCollection: model.sourceCollection,
      },
    });
  return value({});
}
/** Derive the settings of a single integrated embedding field. */
export function deriveEmbed(model: IndexModelData): Derived<LegacyIndexEmbed> {
  const fields = semantic(model);
  if (fields.length !== 1) return absent;
  const field = fields[0];
  return value({
    model: field.model,
    metric: field.metric,
    dimension: field.dimension ?? undefined,
    fieldMap: { text: field.name },
    readParameters: field.readParameters,
    writeParameters: field.writeParameters,
  });
}
/** Explain an unavailable legacy property and show the response fields to inspect instead. */
export function formatDeriveFailure({ reason, detail }: DeriveFailure): string {
  const prefix = `Cannot read \`${detail.property}\` from index ${JSON.stringify(detail.indexName)}: `;
  if (detail.property.endsWith('.readCapacity'))
    return (
      prefix +
      `the 2026-07 API reports no read capacity for this ${detail.deploymentType} index. The SDK will not guess between OnDemand and Dedicated. Read \`index.readCapacity\` for the raw value and report this response shape to Pinecone support.`
    );
  if (reason === 'still-initializing')
    return (
      prefix +
      `the schema is empty and the index is not ready (state ${JSON.stringify(detail.state)}). Wait for readiness and describe it again with \`await pc.indexes.describe(${JSON.stringify(detail.indexName)})\`.`
    );
  const fields =
    detail.fields
      .map(
        (field) =>
          `${JSON.stringify(field.name)} (${field.type}${field.dimension !== undefined ? `, dimension ${field.dimension}` : ''}${field.metric ? `, metric ${field.metric}` : ''}${field.model ? `, model ${field.model}` : ''})`,
      )
      .join(', ') || '(empty schema)';
  const explanation =
    reason === 'unproducible-response'
      ? 'reserved and caller-named vector fields are mixed, so no legacy value can be chosen safely.'
      : reason === 'ambiguous'
        ? 'more than one schema field is a candidate, so there is no single legacy value.'
        : reason === 'not-reported-by-api'
          ? 'the API does not report this property on the integrated model field.'
          : 'this documents-API index shape has no equivalent legacy property; this shape did not exist before 2026-07.';
  const model = detail.fields.find((field) => field.model)?.model;
  const next =
    reason === 'not-reported-by-api' && model
      ? `Look up the model with \`await pc.inference.getModel(${JSON.stringify(model)})\`.`
      : 'Inspect the field you need with `Object.entries(index.schema.fields)`.';
  return prefix + `${explanation} Its schema declares: ${fields}. ${next}`;
}
/** Describe an out-of-contract missing managed/BYOC read capacity. */
export function deriveLegacyReadCapacity(
  model: IndexModelData,
): Derived<ReadCapacityResponse> {
  return model.readCapacity
    ? value(model.readCapacity)
    : failure(
        model,
        `spec.${model.deployment.deploymentType === 'managed' ? 'serverless' : 'byoc'}.readCapacity`,
        'unproducible-response',
      );
}

/** @deprecated Use LegacyIndexSpec or the deployment response. */
export type IndexModelSpec = LegacyIndexSpec;
/** @deprecated Use LegacyIndexEmbed or the semantic_text schema field. */
export type ModelIndexEmbed = LegacyIndexEmbed;
/** @deprecated Use LegacyServerlessSpec or the managed deployment response. */
export type ServerlessSpecResponse = LegacyServerlessSpec;
/** @deprecated Use LegacyByocSpec or the BYOC deployment response. */
export type ByocSpecResponse = LegacyByocSpec;
/** @deprecated Use LegacyPodSpec or the pod deployment response. */
export type PodSpec = LegacyPodSpec;
