/** Reserved vector fields select the vectors API on 2026-07 indexes. */
export const RESERVED_DENSE_VECTOR_FIELD = '_values';
/** Reserved sparse vector field used by classic sparse indexes. */
export const RESERVED_SPARSE_VECTOR_FIELD = '_sparse_values';
/** Shared by legacy request translation and response classification. */
export const RESERVED_VECTOR_FIELD_NAMES: ReadonlySet<string> = new Set([
  RESERVED_DENSE_VECTOR_FIELD,
  RESERVED_SPARSE_VECTOR_FIELD,
]);
