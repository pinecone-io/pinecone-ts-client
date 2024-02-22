/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: v1
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { PodSpecMetadataConfig } from './PodSpecMetadataConfig';
import {
    PodSpecMetadataConfigFromJSON,
    PodSpecMetadataConfigFromJSONTyped,
    PodSpecMetadataConfigToJSON,
} from './PodSpecMetadataConfig';

/**
 * Configuration needed to deploy a pod-based index.
 * @export
 * @interface PodSpec
 */
export interface PodSpec {
    /**
     * The environment where the index is hosted.
     * @type {string}
     * @memberof PodSpec
     */
    environment: string;
    /**
     * The number of replicas. Replicas duplicate your index. They provide higher availability and throughput. Replicas can be scaled up or down as your needs change.
     * @type {number}
     * @memberof PodSpec
     */
    replicas: number;
    /**
     * The number of shards. Shards split your data across multiple pods so you can fit more data into an index.
     * @type {number}
     * @memberof PodSpec
     */
    shards: number;
    /**
     * The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`.
     * @type {string}
     * @memberof PodSpec
     */
    podType: string;
    /**
     * The number of pods to be used in the index. This should be equal to `shards` x `replicas`.'
     * @type {number}
     * @memberof PodSpec
     */
    pods: number;
    /**
     * 
     * @type {PodSpecMetadataConfig}
     * @memberof PodSpec
     */
    metadataConfig?: PodSpecMetadataConfig;
    /**
     * The name of the collection to be used as the source for the index.
     * @type {string}
     * @memberof PodSpec
     */
    sourceCollection?: string;
}

/**
 * Check if a given object implements the PodSpec interface.
 */
export function instanceOfPodSpec(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "environment" in value;
    isInstance = isInstance && "replicas" in value;
    isInstance = isInstance && "shards" in value;
    isInstance = isInstance && "podType" in value;
    isInstance = isInstance && "pods" in value;

    return isInstance;
}

export function PodSpecFromJSON(json: any): PodSpec {
    return PodSpecFromJSONTyped(json, false);
}

export function PodSpecFromJSONTyped(json: any, ignoreDiscriminator: boolean): PodSpec {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'environment': json['environment'],
        'replicas': json['replicas'],
        'shards': json['shards'],
        'podType': json['pod_type'],
        'pods': json['pods'],
        'metadataConfig': !exists(json, 'metadata_config') ? undefined : PodSpecMetadataConfigFromJSON(json['metadata_config']),
        'sourceCollection': !exists(json, 'source_collection') ? undefined : json['source_collection'],
    };
}

export function PodSpecToJSON(value?: PodSpec | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'environment': value.environment,
        'replicas': value.replicas,
        'shards': value.shards,
        'pod_type': value.podType,
        'pods': value.pods,
        'metadata_config': PodSpecMetadataConfigToJSON(value.metadataConfig),
        'source_collection': value.sourceCollection,
    };
}

