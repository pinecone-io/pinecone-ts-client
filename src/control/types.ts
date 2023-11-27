import { Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

// If user passes the empty string for index name, the generated
// OpenAPI client will call /databases/ which is the list
// indexes endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an index named empty
// string. To avoid this confusing case, we require lenth > 1.
export const IndexNameSchema = nonemptyString;

/**
 * Index names are strings composed of:
 * - alphanumeric characters
 * - hyphens
 *
 * Index names must be unique within a project and may not start or end with a hyphen.
 *
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export type IndexName = string;

export const PodTypeSchema = nonemptyString;
export const ReplicasSchema = positiveInteger;
export const PodsSchema = positiveInteger;
export const ShardsSchema = positiveInteger;
export const MetricSchema = Type.Union([
  Type.Literal('cosine'),
  Type.Literal('euclidean'),
  Type.Literal('dotproduct'),
]);
export const DimensionSchema = positiveInteger;
export const RegionSchema = nonemptyString;
export const EnvironmentSchema = nonemptyString;
export const CloudSchema = Type.Union([
  Type.Literal('gcp'),
  Type.Literal('aws'),
  Type.Literal('azure'),
]);
export const CapacityModeSchema = nonemptyString;
export const MetadataConfigSchema = Type.Object(
  {
    indexed: Type.Array(nonemptyString),
  },
  { additionalProperties: false }
);

// If user passes the empty string for collection name, the generated
// OpenAPI client will call /collections/ which is the list
// collection endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an collection named empty
// string. To avoid this confusing case, we require lenth > 1.
export const CollectionNameSchema = nonemptyString;

/**
 * Collection names are strings composed of:
 * - alphanumeric characters
 * - hyphens
 *
 * Collection names must be unique within a project and may not start or end with a hyphen.
 *
 * @see [Understanding collections](https://docs.pinecone.io/docs/collections)
 */
export type CollectionName = string;

/**
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export type PodType =
  | 's1.x1'
  | 's1.x2'
  | 's1.x4'
  | 's1.x8'
  | 'p1.x1'
  | 'p1.x2'
  | 'p1.x4'
  | 'p1.x8'
  | 'p2.x1'
  | 'p2.x2'
  | 'p2.x4'
  | 'p2.x8'
  | string;
