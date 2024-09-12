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
import type { SparseValues } from './SparseValues';
import {
    SparseValuesFromJSON,
    SparseValuesFromJSONTyped,
    SparseValuesToJSON,
} from './SparseValues';

/**
 * 
 * @export
 * @interface ScoredVector
 */
export interface ScoredVector {
    /**
     * This is the vector's unique id.
     * @type {string}
     * @memberof ScoredVector
     */
    id: string;
    /**
     * This is a measure of similarity between this vector and the query vector.  The higher the score, the more they are similar.
     * @type {number}
     * @memberof ScoredVector
     */
    score?: number;
    /**
     * This is the vector data, if it is requested.
     * @type {Array<number>}
     * @memberof ScoredVector
     */
    values?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof ScoredVector
     */
    sparseValues?: SparseValues;
    /**
     * This is the metadata, if it is requested.
     * @type {object}
     * @memberof ScoredVector
     */
    metadata?: object;
}

/**
 * Check if a given object implements the ScoredVector interface.
 */
export function instanceOfScoredVector(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;

    return isInstance;
}

export function ScoredVectorFromJSON(json: any): ScoredVector {
    return ScoredVectorFromJSONTyped(json, false);
}

export function ScoredVectorFromJSONTyped(json: any, ignoreDiscriminator: boolean): ScoredVector {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'score': !exists(json, 'score') ? undefined : json['score'],
        'values': !exists(json, 'values') ? undefined : json['values'],
        'sparseValues': !exists(json, 'sparseValues') ? undefined : SparseValuesFromJSON(json['sparseValues']),
        'metadata': !exists(json, 'metadata') ? undefined : json['metadata'],
    };
}

export function ScoredVectorToJSON(value?: ScoredVector | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'score': value.score,
        'values': value.values,
        'sparseValues': SparseValuesToJSON(value.sparseValues),
        'metadata': value.metadata,
    };
}

