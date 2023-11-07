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
/**
 * 
 * @export
 * @interface IndexListMeta
 */
export interface IndexListMeta {
    /**
     * 
     * @type {string}
     * @memberof IndexListMeta
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof IndexListMeta
     */
    metric: string;
    /**
     * 
     * @type {number}
     * @memberof IndexListMeta
     */
    dimension: number;
    /**
     * 
     * @type {string}
     * @memberof IndexListMeta
     */
    capacityMode: string;
    /**
     * 
     * @type {string}
     * @memberof IndexListMeta
     */
    host: string;
}

/**
 * Check if a given object implements the IndexListMeta interface.
 */
export function instanceOfIndexListMeta(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "metric" in value;
    isInstance = isInstance && "dimension" in value;
    isInstance = isInstance && "capacityMode" in value;
    isInstance = isInstance && "host" in value;

    return isInstance;
}

export function IndexListMetaFromJSON(json: any): IndexListMeta {
    return IndexListMetaFromJSONTyped(json, false);
}

export function IndexListMetaFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexListMeta {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'metric': json['metric'],
        'dimension': json['dimension'],
        'capacityMode': json['capacity_mode'],
        'host': json['host'],
    };
}

export function IndexListMetaToJSON(value?: IndexListMeta | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'metric': value.metric,
        'dimension': value.dimension,
        'capacity_mode': value.capacityMode,
        'host': value.host,
    };
}

