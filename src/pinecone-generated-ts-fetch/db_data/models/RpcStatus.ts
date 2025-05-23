/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2025-04
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ProtobufAny } from './ProtobufAny';
import {
    ProtobufAnyFromJSON,
    ProtobufAnyFromJSONTyped,
    ProtobufAnyToJSON,
} from './ProtobufAny';

/**
 * 
 * @export
 * @interface RpcStatus
 */
export interface RpcStatus {
    /**
     * 
     * @type {number}
     * @memberof RpcStatus
     */
    code?: number;
    /**
     * 
     * @type {string}
     * @memberof RpcStatus
     */
    message?: string;
    /**
     * 
     * @type {Array<ProtobufAny>}
     * @memberof RpcStatus
     */
    details?: Array<ProtobufAny>;
}

/**
 * Check if a given object implements the RpcStatus interface.
 */
export function instanceOfRpcStatus(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function RpcStatusFromJSON(json: any): RpcStatus {
    return RpcStatusFromJSONTyped(json, false);
}

export function RpcStatusFromJSONTyped(json: any, ignoreDiscriminator: boolean): RpcStatus {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'code': !exists(json, 'code') ? undefined : json['code'],
        'message': !exists(json, 'message') ? undefined : json['message'],
        'details': !exists(json, 'details') ? undefined : ((json['details'] as Array<any>).map(ProtobufAnyFromJSON)),
    };
}

export function RpcStatusToJSON(value?: RpcStatus | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'code': value.code,
        'message': value.message,
        'details': value.details === undefined ? undefined : ((value.details as Array<any>).map(ProtobufAnyToJSON)),
    };
}

