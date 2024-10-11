/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
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
 * Detailed information about the error that occurred.
 * @export
 * @interface ErrorResponseError
 */
export interface ErrorResponseError {
    /**
     * 
     * @type {string}
     * @memberof ErrorResponseError
     */
    code: ErrorResponseErrorCodeEnum;
    /**
     * 
     * @type {string}
     * @memberof ErrorResponseError
     */
    message: string;
    /**
     * Additional information about the error. This field is not guaranteed to be present.
     * @type {object}
     * @memberof ErrorResponseError
     */
    details?: object;
}


/**
 * @export
 */
export const ErrorResponseErrorCodeEnum = {
    Ok: 'OK',
    Unknown: 'UNKNOWN',
    InvalidArgument: 'INVALID_ARGUMENT',
    DeadlineExceeded: 'DEADLINE_EXCEEDED',
    QuotaExceeded: 'QUOTA_EXCEEDED',
    NotFound: 'NOT_FOUND',
    AlreadyExists: 'ALREADY_EXISTS',
    PermissionDenied: 'PERMISSION_DENIED',
    Unauthenticated: 'UNAUTHENTICATED',
    ResourceExhausted: 'RESOURCE_EXHAUSTED',
    FailedPrecondition: 'FAILED_PRECONDITION',
    Aborted: 'ABORTED',
    OutOfRange: 'OUT_OF_RANGE',
    Unimplemented: 'UNIMPLEMENTED',
    Internal: 'INTERNAL',
    Unavailable: 'UNAVAILABLE',
    DataLoss: 'DATA_LOSS',
    Forbidden: 'FORBIDDEN',
    UnprocessableEntity: 'UNPROCESSABLE_ENTITY',
    PaymentRequired: 'PAYMENT_REQUIRED'
} as const;
export type ErrorResponseErrorCodeEnum = typeof ErrorResponseErrorCodeEnum[keyof typeof ErrorResponseErrorCodeEnum];


/**
 * Check if a given object implements the ErrorResponseError interface.
 */
export function instanceOfErrorResponseError(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "code" in value;
    isInstance = isInstance && "message" in value;

    return isInstance;
}

export function ErrorResponseErrorFromJSON(json: any): ErrorResponseError {
    return ErrorResponseErrorFromJSONTyped(json, false);
}

export function ErrorResponseErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): ErrorResponseError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'code': json['code'],
        'message': json['message'],
        'details': !exists(json, 'details') ? undefined : json['details'],
    };
}

export function ErrorResponseErrorToJSON(value?: ErrorResponseError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'code': value.code,
        'message': value.message,
        'details': value.details,
    };
}

