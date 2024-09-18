/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-10
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * The response for the `start_import` operation.
 * @export
 * @interface StartImportResponse
 */
export interface StartImportResponse {
    /**
     * Unique identifier for the import operations.
     * @type {string}
     * @memberof StartImportResponse
     */
    id?: string;
}

/**
 * Check if a given object implements the StartImportResponse interface.
 */
export function instanceOfStartImportResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function StartImportResponseFromJSON(json: any): StartImportResponse {
    return StartImportResponseFromJSONTyped(json, false);
}

export function StartImportResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): StartImportResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
    };
}

export function StartImportResponseToJSON(value?: StartImportResponse | null): any {
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

