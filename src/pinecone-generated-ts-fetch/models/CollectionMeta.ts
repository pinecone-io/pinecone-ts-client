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
/**
 * 
 * @export
 * @interface CollectionMeta
 */
export interface CollectionMeta {
    /**
     * 
     * @type {string}
     * @memberof CollectionMeta
     */
    name: string;
    /**
     * The size of the collection in bytes.
     * @type {number}
     * @memberof CollectionMeta
     */
    size: number;
    /**
     * The status of the collection.
     * @type {string}
     * @memberof CollectionMeta
     */
    status: string;
    /**
     * The dimension of the records stored in the collection
     * @type {number}
     * @memberof CollectionMeta
     */
    dimension: number;
    /**
     * The number of records stored in the collection
     * @type {number}
     * @memberof CollectionMeta
     */
    vectorCount: number;
}

/**
 * Check if a given object implements the CollectionMeta interface.
 */
export function instanceOfCollectionMeta(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "size" in value;
    isInstance = isInstance && "status" in value;
    isInstance = isInstance && "dimension" in value;
    isInstance = isInstance && "vectorCount" in value;

    return isInstance;
}

export function CollectionMetaFromJSON(json: any): CollectionMeta {
    return CollectionMetaFromJSONTyped(json, false);
}

export function CollectionMetaFromJSONTyped(json: any, ignoreDiscriminator: boolean): CollectionMeta {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'size': json['size'],
        'status': json['status'],
        'dimension': json['dimension'],
        'vectorCount': json['vector_count'],
    };
}

export function CollectionMetaToJSON(value?: CollectionMeta | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'size': value.size,
        'status': value.status,
        'dimension': value.dimension,
        'vector_count': value.vectorCount,
    };
}

