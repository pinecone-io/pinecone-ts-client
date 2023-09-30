import { Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

// If user passes the empty string for index name, the generated
// OpenAPI client will call /databases/ which is the list
// indexes endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an index named empty
// string. To avoid this confusing case, we require lenth > 1.
export const IndexNameSchema = nonemptyString;
export type IndexName = string;

export const PodTypeSchema = nonemptyString;
export const ReplicasSchema = positiveInteger;
export const PodsSchema = positiveInteger;
export const MetricSchema = nonemptyString;
export const DimensionSchema = positiveInteger;
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
