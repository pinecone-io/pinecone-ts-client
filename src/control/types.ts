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

/**
 * The unique identifier representing a backup.
 *
 * @see [Backups overview](https://docs.pinecone.io/guides/manage-data/backups-overview)
 */
export type BackupId = string;

/** The unique identifier representing a restore job. */
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

// Read capacity request types are defined here rather than re-exported from the
// generated client, so that the `Dedicated` variant requires the settings it
// needs. Re-check against the spec after each `npm run generate:openapi`.

/**
 * The type of machines to use for dedicated read nodes. `t1` includes increased
 * processing power and memory.
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export type DedicatedNodeType = 'b1' | 't1';

/**
 * The scaling strategy to use for dedicated read capacity. `Manual` is the only
 * supported strategy: you choose the replica and shard counts yourself.
 */
export type ReadCapacityScaling = 'Manual' | (string & {});

/**
 * The replica and shard counts to use for manually scaled dedicated read
 * capacity. Omitted values are assigned defaults.
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export interface ScalingConfigManualInput {
  /**
   * The number of replicas to use. Replicas duplicate the compute resources and
   * data of an index, allowing higher query throughput and availability. Setting
   * replicas to 0 disables the index but can be used to reduce costs while usage
   * is paused.
   */
  replicas?: number;
  /**
   * The number of shards to use. Shards determine the storage capacity of an
   * index, with each shard providing 250 GB of storage.
   */
  shards?: number;
}

/**
 * The configuration for dedicated read capacity.
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export interface ReadCapacityDedicatedSettings {
  /** The type of machines to use. */
  nodeType: DedicatedNodeType;
  /** The scaling strategy to use. */
  scaling: ReadCapacityScaling;
  /** The replica and shard counts to use for manual scaling. */
  manual: ScalingConfigManualInput;
}

/**
 * On-demand read capacity. Compute is allocated per query, with no dedicated
 * read nodes to size or manage. This is the default for a new index.
 */
export interface ReadCapacityOnDemand {
  /** The mode of the index. */
  mode: 'OnDemand';
}

/**
 * Dedicated read capacity. Reserves read nodes for the index, giving
 * predictable throughput and latency.
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export interface ReadCapacityDedicated {
  /** The mode of the index. */
  mode: 'Dedicated';
  /** The node type and scaling configuration for the dedicated read nodes. */
  dedicated: ReadCapacityDedicatedSettings;
}

/**
 * The read capacity configuration for an index. Omit it to use on-demand
 * capacity.
 *
 * ```typescript
 * const onDemand: ReadCapacity = { mode: 'OnDemand' };
 *
 * const dedicated: ReadCapacity = {
 *   mode: 'Dedicated',
 *   dedicated: {
 *     nodeType: 't1',
 *     scaling: 'Manual',
 *     manual: { replicas: 2, shards: 1 },
 *   },
 * };
 * ```
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export type ReadCapacity = ReadCapacityOnDemand | ReadCapacityDedicated;
