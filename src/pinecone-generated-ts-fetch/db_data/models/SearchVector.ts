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
 * @interface SearchVector
 */
export interface SearchVector {
    /**
     * This is the vector data included in the request.
     * @type {Array<number>}
     * @memberof SearchVector
     */
    values?: Array<number>;
}

/**
 * Check if a given object implements the SearchVector interface.
 */
export function instanceOfSearchVector(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function SearchVectorFromJSON(json: any): SearchVector {
    return SearchVectorFromJSONTyped(json, false);
}

export function SearchVectorFromJSONTyped(json: any, ignoreDiscriminator: boolean): SearchVector {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'values': !exists(json, 'values') ? undefined : json['values'],
    };
}

export function SearchVectorToJSON(value?: SearchVector | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'values': value.values,
    };
}

