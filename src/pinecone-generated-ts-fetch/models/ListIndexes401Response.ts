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
import type { ListIndexes401ResponseError } from './ListIndexes401ResponseError';
import {
    ListIndexes401ResponseErrorFromJSON,
    ListIndexes401ResponseErrorFromJSONTyped,
    ListIndexes401ResponseErrorToJSON,
} from './ListIndexes401ResponseError';

/**
 * The response shape used for all error responses.
 * @export
 * @interface ListIndexes401Response
 */
export interface ListIndexes401Response {
    /**
     * The HTTP status code of the error.
     * @type {number}
     * @memberof ListIndexes401Response
     */
    status: number;
    /**
     * 
     * @type {ListIndexes401ResponseError}
     * @memberof ListIndexes401Response
     */
    error: ListIndexes401ResponseError;
}

/**
 * Check if a given object implements the ListIndexes401Response interface.
 */
export function instanceOfListIndexes401Response(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "status" in value;
    isInstance = isInstance && "error" in value;

    return isInstance;
}

export function ListIndexes401ResponseFromJSON(json: any): ListIndexes401Response {
    return ListIndexes401ResponseFromJSONTyped(json, false);
}

export function ListIndexes401ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListIndexes401Response {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'status': json['status'],
        'error': ListIndexes401ResponseErrorFromJSON(json['error']),
    };
}

export function ListIndexes401ResponseToJSON(value?: ListIndexes401Response | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'status': value.status,
        'error': ListIndexes401ResponseErrorToJSON(value.error),
    };
}

