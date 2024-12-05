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
import type { Vector } from './Vector';
import {
    VectorFromJSON,
    VectorFromJSONTyped,
    VectorToJSON,
} from './Vector';

/**
 * The request for the `upsert` operation.
 * @export
 * @interface UpsertRequest
 */
export interface UpsertRequest {
    /**
     * An array containing the vectors to upsert. Recommended batch limit is 100 vectors.
     * @type {Array<Vector>}
     * @memberof UpsertRequest
     */
    vectors: Array<Vector>;
    /**
     * The namespace where you upsert vectors.
     * @type {string}
     * @memberof UpsertRequest
     */
    namespace?: string;
}

/**
 * Check if a given object implements the UpsertRequest interface.
 */
export function instanceOfUpsertRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "vectors" in value;

    return isInstance;
}

export function UpsertRequestFromJSON(json: any): UpsertRequest {
    return UpsertRequestFromJSONTyped(json, false);
}

export function UpsertRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpsertRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'vectors': ((json['vectors'] as Array<any>).map(VectorFromJSON)),
        'namespace': !exists(json, 'namespace') ? undefined : json['namespace'],
    };
}

export function UpsertRequestToJSON(value?: UpsertRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'vectors': ((value.vectors as Array<any>).map(VectorToJSON)),
        'namespace': value.namespace,
    };
}

