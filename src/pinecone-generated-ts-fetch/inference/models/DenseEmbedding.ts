/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Inference API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2025-01
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * A dense embedding of a single input
 * @export
 * @interface DenseEmbedding
 */
export interface DenseEmbedding {
    /**
     * The dense embedding values.
     * @type {Array<number>}
     * @memberof DenseEmbedding
     */
    values: Array<number>;
}

/**
 * Check if a given object implements the DenseEmbedding interface.
 */
export function instanceOfDenseEmbedding(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "values" in value;

    return isInstance;
}

export function DenseEmbeddingFromJSON(json: any): DenseEmbedding {
    return DenseEmbeddingFromJSONTyped(json, false);
}

export function DenseEmbeddingFromJSONTyped(json: any, ignoreDiscriminator: boolean): DenseEmbedding {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'values': json['values'],
    };
}

export function DenseEmbeddingToJSON(value?: DenseEmbedding | null): any {
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

