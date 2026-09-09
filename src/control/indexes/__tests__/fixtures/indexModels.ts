import type { IndexModelData, IndexSchema } from '../../listIndexes';

const managed = {
  deploymentType: 'managed',
  cloud: 'aws',
  region: 'us-east-1',
} as const;
export const capacity = {
  mode: 'OnDemand',
  status: { state: 'Ready' },
} as const;
const dense = (dimension = 1536, metric = 'cosine') =>
  ({ type: 'dense_vector', dimension, metric }) as const;
const sparse = { type: 'sparse_vector' } as const;
const classic = { _values: dense(), _sparse_values: sparse };
const fields = (
  fields: IndexSchema['fields'],
  extra: Partial<IndexModelData> = {},
): IndexModelData => ({
  name: 'test-index',
  host: 'test.pinecone.io',
  deployment: managed,
  status: { ready: true, state: 'Ready' },
  deletionProtection: 'disabled',
  readCapacity: capacity,
  schema: { fields },
  ...extra,
});
export const fixtures = {
  classicDense: fields(classic),
  classicSparse: fields({ _sparse_values: sparse }),
  namedDense: fields({ embedding: dense(768, 'dotproduct') }),
  namedSparse: fields({ keywords: sparse }),
  classicDenseWithLegacyMetadata: fields({
    _values: dense(1024, 'dotproduct'),
    _sparse_values: sparse,
    genre: { filterable: true },
    year: { filterable: true },
  }),
  genuineHybridNamed: fields({
    dense_vec: dense(8, 'euclidean'),
    sparse_vec: sparse,
  }),
  mixedReservedAndNamed: fields({ _values: dense(8), sparse_vec: sparse }),
  twoDense: fields({ image_vec: dense(512), text_vec: dense() }),
  twoSparse: fields({ a: sparse, b: sparse }),
  integratedWithMetric: fields({
    chunk_text: {
      type: 'semantic_text',
      model: 'multilingual-e5-large',
      metric: 'cosine',
    },
  }),
  integratedNoMetric: fields({
    chunk_text: { type: 'semantic_text', model: 'llama-text-embed-v2' },
  }),
  fullTextOnly: fields({
    body: {
      type: 'string',
      fullTextSearch: { language: 'en', stemming: false, stopWords: false },
    },
  }),
  documentsMetadataOnly: fields({
    title: { type: 'string', filterable: true },
    year: { type: 'float' },
    tags: { type: 'string_list' },
    published: { type: 'boolean' },
  }),
  declaredPlusServerAdded: fields({
    ...classic,
    genre: { type: 'string', filterable: true },
    year: { type: 'float' },
    in_stock: { type: 'boolean' },
    authors: { type: 'string_list' },
    legacy_count: { type: 'integer' },
  }),
  denseWithUntyped: fields({
    ...classic,
    genre: { filterable: true },
    year: { filterable: true },
  }),
  untypedOnly: fields({
    genre: { filterable: true },
    year: { filterable: true },
  }),
  emptySchema: fields({}),
  podFull: fields(classic, {
    deployment: {
      deploymentType: 'pod',
      environment: 'us-east1-gcp',
      podType: 'p1.x1',
      replicas: 2,
      shards: 2,
    },
    readCapacity: undefined,
  }),
  podPartial: fields(classic, {
    deployment: {
      deploymentType: 'pod',
      environment: 'us-east1-gcp',
      podType: 'p1.x1',
      replicas: 2,
    },
    readCapacity: undefined,
  }),
  byoc: fields(classic, {
    deployment: { deploymentType: 'byoc', environment: 'aws-us-east-1-b921' },
  }),
  managedWithEnvironment: fields(
    { _values: dense(768), _sparse_values: sparse },
    { deployment: { ...managed, environment: 'aped-4627-b74a' } },
  ),
  initializing: fields(
    {},
    { host: undefined, status: { ready: false, state: 'Initializing' } },
  ),
  unknownDeploymentType: fields(classic, {
    deployment: {
      deploymentType: 'future',
    } as unknown as IndexModelData['deployment'],
  }),
  managedMissingReadCapacity: fields(classic, { readCapacity: undefined }),
  // Additional cases reflect the regenerated spec's semantic dimension field.
  integratedReportedDimension: fields({
    chunk_text: {
      type: 'semantic_text',
      model: 'dense-model',
      dimension: 1024,
      metric: 'cosine',
    },
  }),
  integratedSparseDimension: fields({
    chunk_text: {
      type: 'semantic_text',
      model: 'sparse-model',
      dimension: null,
    },
  }),
  // Hypothetical until fleet verification; reserved vector classification must
  // not treat a semantic field as a caller-named *vector* field.
  reservedWithSemantic: fields({
    ...classic,
    chunk_text: {
      type: 'semantic_text',
      model: 'dense-model',
      dimension: 1536,
      metric: 'cosine',
    },
  }),
} satisfies Record<string, IndexModelData>;
