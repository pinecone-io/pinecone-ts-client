/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: version not set
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { CreateRequestIndexConfig } from './CreateRequestIndexConfig';
import {
    CreateRequestIndexConfigFromJSON,
    CreateRequestIndexConfigFromJSONTyped,
    CreateRequestIndexConfigToJSON,
} from './CreateRequestIndexConfig';

/**
 * 
 * @export
 * @interface CreateRequest
 */
export interface CreateRequest {
    /**
     * The name of the index to be created. The maximum length is 45 characters.
     * @type {string}
     * @memberof CreateRequest
     */
    name: string;
    /**
     * The dimensions of the vectors to be inserted in the index
     * @type {number}
     * @memberof CreateRequest
     */
    dimension: number;
    /**
     * The region where you would like your index to be created
     * @type {string}
     * @memberof CreateRequest
     */
    region: string;
    /**
     * The public cloud where you would like your index hosted
     * @type {string}
     * @memberof CreateRequest
     */
    cloud: CreateRequestCloudEnum;
    /**
     * The capacity mode for the index.
     * @type {string}
     * @memberof CreateRequest
     */
    capacityMode: string;
    /**
     * The type of vector index. Pinecone supports 'approximated'.
     * @type {string}
     * @memberof CreateRequest
     * @deprecated
     */
    indexType?: string;
    /**
     * The distance metric to be used for similarity search. You can use 'euclidean', 'cosine', or 'dotproduct'.
     * @type {string}
     * @memberof CreateRequest
     */
    metric?: string;
    /**
     * The number of pods for the index to use,including replicas.
     * @type {number}
     * @memberof CreateRequest
     */
    pods?: number;
    /**
     * The number of replicas. Replicas duplicate your index. They provide higher availability and throughput.
     * @type {number}
     * @memberof CreateRequest
     */
    replicas?: number;
    /**
     * The number of shards to be used in the index.
     * @type {number}
     * @memberof CreateRequest
     */
    shards?: number;
    /**
     * The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`.
     * @type {string}
     * @memberof CreateRequest
     */
    podType?: string;
    /**
     * 
     * @type {CreateRequestIndexConfig}
     * @memberof CreateRequest
     * @deprecated
     */
    indexConfig?: CreateRequestIndexConfig;
    /**
     * Configuration for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when `metadata_config` is present, only specified metadata fields are indexed. To specify metadata fields to index, provide a JSON object of the following form: 
     *   ``` 
     *  {"indexed": ["example_metadata_field"]} 
     *  ``` 
     * @type {object}
     * @memberof CreateRequest
     */
    metadataConfig?: object | null;
    /**
     * The name of the collection to create an index from
     * @type {string}
     * @memberof CreateRequest
     */
    sourceCollection?: string;
}


/**
 * @export
 */
export const CreateRequestCloudEnum = {
    Gcp: 'gcp',
    Aws: 'aws',
    Azure: 'azure'
} as const;
export type CreateRequestCloudEnum = typeof CreateRequestCloudEnum[keyof typeof CreateRequestCloudEnum];


/**
 * Check if a given object implements the CreateRequest interface.
 */
export function instanceOfCreateRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "dimension" in value;
    isInstance = isInstance && "region" in value;
    isInstance = isInstance && "cloud" in value;
    isInstance = isInstance && "capacityMode" in value;

    return isInstance;
}

export function CreateRequestFromJSON(json: any): CreateRequest {
    return CreateRequestFromJSONTyped(json, false);
}

export function CreateRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'dimension': json['dimension'],
        'region': json['region'],
        'cloud': json['cloud'],
        'capacityMode': json['capacity_mode'],
        'indexType': !exists(json, 'index_type') ? undefined : json['index_type'],
        'metric': !exists(json, 'metric') ? undefined : json['metric'],
        'pods': !exists(json, 'pods') ? undefined : json['pods'],
        'replicas': !exists(json, 'replicas') ? undefined : json['replicas'],
        'shards': !exists(json, 'shards') ? undefined : json['shards'],
        'podType': !exists(json, 'pod_type') ? undefined : json['pod_type'],
        'indexConfig': !exists(json, 'index_config') ? undefined : CreateRequestIndexConfigFromJSON(json['index_config']),
        'metadataConfig': !exists(json, 'metadata_config') ? undefined : json['metadata_config'],
        'sourceCollection': !exists(json, 'source_collection') ? undefined : json['source_collection'],
    };
}

export function CreateRequestToJSON(value?: CreateRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'dimension': value.dimension,
        'region': value.region,
        'cloud': value.cloud,
        'capacity_mode': value.capacityMode,
        'index_type': value.indexType,
        'metric': value.metric,
        'pods': value.pods,
        'replicas': value.replicas,
        'shards': value.shards,
        'pod_type': value.podType,
        'index_config': CreateRequestIndexConfigToJSON(value.indexConfig),
        'metadata_config': value.metadataConfig,
        'source_collection': value.sourceCollection,
    };
}

