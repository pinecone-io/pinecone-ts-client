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
import type { IndexListMeta } from './IndexListMeta';
import {
    IndexListMetaFromJSON,
    IndexListMetaFromJSONTyped,
    IndexListMetaToJSON,
} from './IndexListMeta';

/**
 * 
 * @export
 * @interface ListIndexes200Response
 */
export interface ListIndexes200Response {
    /**
     * 
     * @type {Array<IndexListMeta>}
     * @memberof ListIndexes200Response
     */
    databases?: Array<IndexListMeta>;
}

/**
 * Check if a given object implements the ListIndexes200Response interface.
 */
export function instanceOfListIndexes200Response(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ListIndexes200ResponseFromJSON(json: any): ListIndexes200Response {
    return ListIndexes200ResponseFromJSONTyped(json, false);
}

export function ListIndexes200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListIndexes200Response {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'databases': !exists(json, 'databases') ? undefined : ((json['databases'] as Array<any>).map(IndexListMetaFromJSON)),
    };
}

export function ListIndexes200ResponseToJSON(value?: ListIndexes200Response | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'databases': value.databases === undefined ? undefined : ((value.databases as Array<any>).map(IndexListMetaToJSON)),
    };
}

