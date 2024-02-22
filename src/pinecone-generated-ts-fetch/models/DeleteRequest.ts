/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: v1
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * The request for the `Delete` operation.
 * @export
 * @interface DeleteRequest
 */
export interface DeleteRequest {
    /**
     * Vectors to delete.
     * @type {Array<string>}
     * @memberof DeleteRequest
     */
    ids?: Array<string>;
    /**
     * This indicates that all vectors in the index namespace should be deleted.
     * @type {boolean}
     * @memberof DeleteRequest
     */
    deleteAll?: boolean;
    /**
     * The namespace to delete vectors from, if applicable.
     * @type {string}
     * @memberof DeleteRequest
     */
    namespace?: string;
    /**
     * If specified, the metadata filter here will be used to select the vectors to delete. This is mutually exclusive
     * with specifying ids to delete in the ids param or using delete_all=True.
     * See https://www.pinecone.io/docs/metadata-filtering/.
     * @type {object}
     * @memberof DeleteRequest
     */
    filter?: object;
}

/**
 * Check if a given object implements the DeleteRequest interface.
 */
export function instanceOfDeleteRequest(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function DeleteRequestFromJSON(json: any): DeleteRequest {
    return DeleteRequestFromJSONTyped(json, false);
}

export function DeleteRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): DeleteRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ids': !exists(json, 'ids') ? undefined : json['ids'],
        'deleteAll': !exists(json, 'deleteAll') ? undefined : json['deleteAll'],
        'namespace': !exists(json, 'namespace') ? undefined : json['namespace'],
        'filter': !exists(json, 'filter') ? undefined : json['filter'],
    };
}

export function DeleteRequestToJSON(value?: DeleteRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ids': value.ids,
        'deleteAll': value.deleteAll,
        'namespace': value.namespace,
        'filter': value.filter,
    };
}

