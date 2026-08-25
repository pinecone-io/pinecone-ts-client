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

// Values sent to the API are exact unions; values read back also accept
// `string`, so a status added server-side cannot break a pinned client.

/**
 * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection)
 * is enabled for an index. An index cannot be deleted while it is `enabled`.
 */
export type DeletionProtection = 'enabled' | 'disabled';

/**
 * The distance metric used for similarity search.
 *
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export type IndexMetric = 'cosine' | 'euclidean' | 'dotproduct';

/**
 * The current state of an index.
 *
 * An index is ready for data operations once `Ready`. `InitializationFailed` is
 * terminal; the rest are transitional.
 */
export type IndexState =
  | 'Initializing'
  | 'InitializationFailed'
  | 'ScalingUp'
  | 'ScalingDown'
  | 'ScalingUpPodSize'
  | 'ScalingDownPodSize'
  | 'Terminating'
  | 'Ready'
  | 'Disabled'
  | (string & {});

/**
 * The current status of a collection.
 *
 * @see [Understanding collections](https://docs.pinecone.io/docs/collections)
 */
export type CollectionStatus =
  'Initializing' | 'Ready' | 'Terminating' | (string & {});

/**
 * The current status of a backup.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export type BackupStatus = 'Initializing' | 'Ready' | 'Failed' | (string & {});

/**
 * The state of an index's read capacity.
 *
 * `Scaling` follows a change to the replica or shard count, `Migrating` a change
 * to the node type. On `Error`, see `errorMessage` for details.
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export type ReadCapacityState =
  'Ready' | 'Scaling' | 'Migrating' | 'Error' | (string & {});

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

// Hand-rolled so the `Dedicated` variant requires the settings it needs.
// Re-check against the spec after each `npm run generate:openapi`.

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

// Hand-rolled so `cloud` and `podType` carry their real value sets, and so the
// `deploymentType` discriminant can be written as a literal.

/**
 * The public cloud an index is hosted in.
 *
 * @see [Cloud regions](http://docs.pinecone.io/guides/index-data/create-an-index#cloud-regions)
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure';

/**
 * A managed (serverless) deployment. Pinecone runs the index in the cloud and
 * region you choose, scaling it for you. This is the default for a new index.
 *
 * @see [Serverless indexes](https://docs.pinecone.io/guides/index-data/indexing-overview)
 */
export interface ManagedDeployment {
  deploymentType: 'managed';
  /** The public cloud to host the index in. */
  cloud: CloudProvider;
  /** The region to host the index in, such as `us-east-1`. */
  region: string;
}

/**
 * A pod-based deployment. You choose the pod size and how many of them to run.
 *
 * @see [Pod-based indexes](https://docs.pinecone.io/guides/index-data/indexing-overview)
 */
export interface PodDeployment {
  deploymentType: 'pod';
  /** The environment to host the index in, such as `us-east-1-aws`. */
  environment: string;
  /** The size of pod to use. */
  podType: PodType;
  /**
   * The number of replicas. Replicas duplicate the index, providing higher
   * availability and throughput. Can be scaled up or down later.
   */
  replicas?: number;
  /**
   * The number of shards. Shards split data across multiple pods so more data
   * fits in one index.
   */
  shards?: number;
}

/**
 * A Bring Your Own Cloud deployment, hosted in your own cloud environment.
 *
 * @see [Bring Your Own Cloud](https://docs.pinecone.io/guides/production/bring-your-own-cloud)
 */
export interface ByocDeployment {
  deploymentType: 'byoc';
  /** The BYOC environment to host the index in. */
  environment: string;
}

/**
 * How an index should be deployed. Omit it when creating an index to get a
 * managed (serverless) deployment on AWS `us-east-1`.
 *
 * ```typescript
 * const deployment: IndexDeploymentRequest = {
 *   deploymentType: 'managed',
 *   cloud: 'aws',
 *   region: 'us-east-1',
 * };
 * ```
 */
export type IndexDeploymentRequest =
  ManagedDeployment | PodDeployment | ByocDeployment;

/**
 * The pod settings to change on an existing index. Applies to pod-based
 * indexes only; omit a field to leave it unchanged.
 */
export interface ConfigureIndexDeployment {
  /** The number of replicas to scale to. */
  replicas?: number;
  /** The pod size to scale to. */
  podType?: PodType;
}
