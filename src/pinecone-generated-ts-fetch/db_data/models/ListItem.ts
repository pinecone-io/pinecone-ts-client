/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: unstable
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
 * @interface ListItem
 */
export interface ListItem {
    /**
     * 
     * @type {string}
     * @memberof ListItem
     */
    id?: string;
}

/**
 * Check if a given object implements the ListItem interface.
 */
export function instanceOfListItem(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ListItemFromJSON(json: any): ListItem {
    return ListItemFromJSONTyped(json, false);
}

export function ListItemFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListItem {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
    };
}

export function ListItemToJSON(value?: ListItem | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
    };
}

