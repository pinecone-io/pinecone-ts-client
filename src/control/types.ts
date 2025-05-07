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

export type BackupId = string;

export type RestoreJobId = string;

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
  | 'p2.x8';

export const ValidPodTypes: PodType[] = [
  's1.x1',
  's1.x2',
  's1.x4',
  's1.x8',
  'p1.x1',
  'p1.x2',
  'p1.x4',
  'p1.x8',
  'p2.x1',
  'p2.x2',
  'p2.x4',
  'p2.x8',
];
