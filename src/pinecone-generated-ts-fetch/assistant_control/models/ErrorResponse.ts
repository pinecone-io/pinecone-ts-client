/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Control Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge  from millions of documents at scale. This API supports creating and managing assistants. 
 *
 * The version of the OpenAPI document: 2025-01
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ErrorResponseError } from './ErrorResponseError';
import {
    ErrorResponseErrorFromJSON,
    ErrorResponseErrorFromJSONTyped,
    ErrorResponseErrorToJSON,
} from './ErrorResponseError';

/**
 * The response shape used for all error responses.
 * @export
 * @interface ErrorResponse
 */
export interface ErrorResponse {
    /**
     * The HTTP status code of the error.
     * @type {number}
     * @memberof ErrorResponse
     */
    status: number;
    /**
     * 
     * @type {ErrorResponseError}
     * @memberof ErrorResponse
     */
    error: ErrorResponseError;
}

/**
 * Check if a given object implements the ErrorResponse interface.
 */
export function instanceOfErrorResponse(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "status" in value;
    isInstance = isInstance && "error" in value;

    return isInstance;
}

export function ErrorResponseFromJSON(json: any): ErrorResponse {
    return ErrorResponseFromJSONTyped(json, false);
}

export function ErrorResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ErrorResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'status': json['status'],
        'error': ErrorResponseErrorFromJSON(json['error']),
    };
}

export function ErrorResponseToJSON(value?: ErrorResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'status': value.status,
        'error': ErrorResponseErrorToJSON(value.error),
    };
}

