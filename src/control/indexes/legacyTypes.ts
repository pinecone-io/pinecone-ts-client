import type { ReadCapacity, DedicatedNodeType } from '../types';
import type { NativeCreateIndexOptions } from './createIndex';

/** @deprecated Use the nested `ReadCapacity` configuration. */
export type CreateIndexReadCapacity =
  | {
      /** @deprecated Omit read capacity or use mode OnDemand. */
      mode?: 'OnDemand';
    }
  | {
      /** @deprecated Dedicated mode is inferred from nodeType and manual. */
      mode?: 'Dedicated';
      /** @deprecated Use dedicated.nodeType. */
      nodeType: DedicatedNodeType;
      /** @deprecated Use dedicated.manual. */
      manual: {
        /** Number of replicas; zero disables reads. */
        replicas: number;
        /** Positive number of shards. */
        shards: number;
      };
    };

/** @deprecated Use {@link ReadCapacityOnDemand} with nested read capacity. */
export type ReadCapacityOnDemandParams = Extract<
  CreateIndexReadCapacity,
  {
    /** Selects the legacy on-demand variant. */
    mode?: 'OnDemand';
  }
>;

/** @deprecated Use {@link ReadCapacityDedicated} with nested read capacity. */
export type ReadCapacityDedicatedParams = Extract<
  CreateIndexReadCapacity,
  {
    /** Selects the legacy dedicated variant. */
    nodeType: DedicatedNodeType;
  }
>;

/** @deprecated Use `deployment` and top-level `readCapacity`. */
export interface CreateIndexServerlessSpec {
  /** @deprecated Use `deployment.cloud`. */
  cloud: string;
  /** @deprecated Use `deployment.region`. */
  region: string;
  /** @deprecated Use top-level `readCapacity`. */
  readCapacity?: CreateIndexReadCapacity | ReadCapacity;
}
/** @deprecated Use a BYOC `deployment` and top-level `readCapacity`. */
export interface CreateIndexByocSpec {
  /** @deprecated Use `deployment.environment`. */
  environment: string;
  /** @deprecated Use top-level `readCapacity`. */
  readCapacity?: CreateIndexReadCapacity | ReadCapacity;
}
/** @deprecated New pod indexes cannot be created. Use a managed or BYOC deployment. */
export interface CreateIndexPodSpec {
  /** @deprecated Existing pod indexes can still be configured. */
  environment: string;
  /** @deprecated Existing pod indexes can still be configured. */
  podType: string;
  /** @deprecated Existing pod indexes can still be configured. */
  replicas?: number;
  /** @deprecated New pod indexes cannot be created. */
  shards?: number;
  /** @deprecated New pod indexes cannot be created. */
  pods?: number;
}
/** @deprecated Use `deployment` when creating an index. */
export interface LegacyCreateIndexSpec {
  /** @deprecated Use a managed `deployment`. */
  serverless?: CreateIndexServerlessSpec;
  /** @deprecated Use a BYOC `deployment`. */
  byoc?: CreateIndexByocSpec;
  /** @deprecated New pod indexes cannot be created. Use a managed or BYOC deployment. */
  pod?: CreateIndexPodSpec;
}
/** @deprecated Use `deployment` when creating an index. */
export type CreateIndexSpec = LegacyCreateIndexSpec;

/** @deprecated Use `schema` and `deployment` for new code. */
export interface LegacyCreateIndexOptions extends Omit<
  NativeCreateIndexOptions,
  | 'schema'
  | 'deployment'
  | 'dimension'
  | 'metric'
  | 'vectorType'
  | 'spec'
  | 'readCapacity'
> {
  /** @deprecated Use a dense vector schema field. */
  dimension?: number;
  /** @deprecated Use the metric on the dense vector schema field. */
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
  /** @deprecated Use a dense or sparse vector schema field. */
  vectorType?: 'dense' | 'sparse';
  /** @deprecated Use `deployment`. */
  spec: LegacyCreateIndexSpec;
  /** Read capacity overrides the capacity provided in `spec`. */
  readCapacity?: CreateIndexReadCapacity | ReadCapacity;
  /** Legacy and schema-based options cannot be combined. */
  schema?: never;
  /** Legacy and schema-based options cannot be combined. */
  deployment?: never;
}
