/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-07
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { DeletionProtection } from './DeletionProtection';
import {
    DeletionProtectionFromJSON,
    DeletionProtectionFromJSONTyped,
    DeletionProtectionToJSON,
} from './DeletionProtection';
import type { IndexModelSpec } from './IndexModelSpec';
import {
    IndexModelSpecFromJSON,
    IndexModelSpecFromJSONTyped,
    IndexModelSpecToJSON,
} from './IndexModelSpec';
import type { IndexModelStatus } from './IndexModelStatus';
import {
    IndexModelStatusFromJSON,
    IndexModelStatusFromJSONTyped,
    IndexModelStatusToJSON,
} from './IndexModelStatus';

/**
 * The IndexModel describes the configuration and status of a Pinecone index.
 * @export
 * @interface IndexModel
 */
export interface IndexModel {
    /**
     * The name of the index. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof IndexModel
     */
    name: string;
    /**
     * The dimensions of the vectors to be inserted in the index.
     * @type {number}
     * @memberof IndexModel
     */
    dimension: number;
    /**
     * The distance metric to be used for similarity search. You can use 'euclidean', 'cosine', or 'dotproduct'.
     * @type {string}
     * @memberof IndexModel
     */
    metric: IndexModelMetricEnum;
    /**
     * The URL address where the index is hosted.
     * @type {string}
     * @memberof IndexModel
     */
    host: string;
    /**
     * 
     * @type {DeletionProtection}
     * @memberof IndexModel
     */
    deletionProtection?: DeletionProtection;
    /**
     * 
     * @type {IndexModelSpec}
     * @memberof IndexModel
     */
    spec: IndexModelSpec;
    /**
     * 
     * @type {IndexModelStatus}
     * @memberof IndexModel
     */
    status: IndexModelStatus;
}


/**
 * @export
 */
export const IndexModelMetricEnum = {
    Cosine: 'cosine',
    Euclidean: 'euclidean',
    Dotproduct: 'dotproduct'
} as const;
export type IndexModelMetricEnum = typeof IndexModelMetricEnum[keyof typeof IndexModelMetricEnum];


/**
 * Check if a given object implements the IndexModel interface.
 */
export function instanceOfIndexModel(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "dimension" in value;
    isInstance = isInstance && "metric" in value;
    isInstance = isInstance && "host" in value;
    isInstance = isInstance && "spec" in value;
    isInstance = isInstance && "status" in value;

    return isInstance;
}

export function IndexModelFromJSON(json: any): IndexModel {
    return IndexModelFromJSONTyped(json, false);
}

export function IndexModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'dimension': json['dimension'],
        'metric': json['metric'],
        'host': json['host'],
        'deletionProtection': !exists(json, 'deletion_protection') ? undefined : DeletionProtectionFromJSON(json['deletion_protection']),
        'spec': IndexModelSpecFromJSON(json['spec']),
        'status': IndexModelStatusFromJSON(json['status']),
    };
}

export function IndexModelToJSON(value?: IndexModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'dimension': value.dimension,
        'metric': value.metric,
        'host': value.host,
        'deletion_protection': DeletionProtectionToJSON(value.deletionProtection),
        'spec': IndexModelSpecToJSON(value.spec),
        'status': IndexModelStatusToJSON(value.status),
    };
}

