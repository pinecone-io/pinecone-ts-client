import { Type, Static } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

// If user passes the empty string for index name, the generated
// OpenAPI client will call /databases/ which is the list
// indexes endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an index named empty
// string. To avoid this confusing case, we require lenth > 1.
export const IndexNameSchema = nonemptyString;
export type IndexName = Static<typeof IndexNameSchema>;

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
export type CollectionName = Static<typeof CollectionNameSchema>;
