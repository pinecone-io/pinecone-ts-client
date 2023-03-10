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
import type { IndexMetaDatabaseIndexConfig } from './IndexMetaDatabaseIndexConfig';
import {
    IndexMetaDatabaseIndexConfigFromJSON,
    IndexMetaDatabaseIndexConfigFromJSONTyped,
    IndexMetaDatabaseIndexConfigToJSON,
} from './IndexMetaDatabaseIndexConfig';
import type { IndexMetaDatabaseStatus } from './IndexMetaDatabaseStatus';
import {
    IndexMetaDatabaseStatusFromJSON,
    IndexMetaDatabaseStatusFromJSONTyped,
    IndexMetaDatabaseStatusToJSON,
} from './IndexMetaDatabaseStatus';

/**
 * 
 * @export
 * @interface IndexMetaDatabase
 */
export interface IndexMetaDatabase {
    /**
     * 
     * @type {string}
     * @memberof IndexMetaDatabase
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof IndexMetaDatabase
     */
    dimensions?: string;
    /**
     * 
     * @type {string}
     * @memberof IndexMetaDatabase
     * @deprecated
     */
    indexType?: string;
    /**
     * 
     * @type {string}
     * @memberof IndexMetaDatabase
     */
    metric?: string;
    /**
     * 
     * @type {number}
     * @memberof IndexMetaDatabase
     */
    pods?: number;
    /**
     * 
     * @type {number}
     * @memberof IndexMetaDatabase
     */
    replicas?: number;
    /**
     * 
     * @type {number}
     * @memberof IndexMetaDatabase
     */
    shards?: number;
    /**
     * 
     * @type {string}
     * @memberof IndexMetaDatabase
     */
    podType?: string;
    /**
     * 
     * @type {IndexMetaDatabaseIndexConfig}
     * @memberof IndexMetaDatabase
     */
    indexConfig?: IndexMetaDatabaseIndexConfig;
    /**
     * 
     * @type {IndexMetaDatabaseStatus}
     * @memberof IndexMetaDatabase
     */
    status?: IndexMetaDatabaseStatus;
}

/**
 * Check if a given object implements the IndexMetaDatabase interface.
 */
export function instanceOfIndexMetaDatabase(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function IndexMetaDatabaseFromJSON(json: any): IndexMetaDatabase {
    return IndexMetaDatabaseFromJSONTyped(json, false);
}

export function IndexMetaDatabaseFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexMetaDatabase {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'dimensions': !exists(json, 'dimensions') ? undefined : json['dimensions'],
        'indexType': !exists(json, 'index_type') ? undefined : json['index_type'],
        'metric': !exists(json, 'metric') ? undefined : json['metric'],
        'pods': !exists(json, 'pods') ? undefined : json['pods'],
        'replicas': !exists(json, 'replicas') ? undefined : json['replicas'],
        'shards': !exists(json, 'shards') ? undefined : json['shards'],
        'podType': !exists(json, 'pod_type') ? undefined : json['pod_type'],
        'indexConfig': !exists(json, 'index_config') ? undefined : IndexMetaDatabaseIndexConfigFromJSON(json['index_config']),
        'status': !exists(json, 'status') ? undefined : IndexMetaDatabaseStatusFromJSON(json['status']),
    };
}

export function IndexMetaDatabaseToJSON(value?: IndexMetaDatabase | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'dimensions': value.dimensions,
        'index_type': value.indexType,
        'metric': value.metric,
        'pods': value.pods,
        'replicas': value.replicas,
        'shards': value.shards,
        'pod_type': value.podType,
        'index_config': IndexMetaDatabaseIndexConfigToJSON(value.indexConfig),
        'status': IndexMetaDatabaseStatusToJSON(value.status),
    };
}

