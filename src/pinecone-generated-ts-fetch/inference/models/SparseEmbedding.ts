/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Inference API
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
/**
 * A sparse embedding of a single input
 * @export
 * @interface SparseEmbedding
 */
export interface SparseEmbedding {
    /**
     * The sparse embedding values.
     * @type {Array<number>}
     * @memberof SparseEmbedding
     */
    sparseValues: Array<number>;
    /**
     * The sparse embedding indices.
     * @type {Array<number>}
     * @memberof SparseEmbedding
     */
    sparseIndices: Array<number>;
    /**
     * The normalized tokens used to create the sparse embedding.
     * @type {Array<string>}
     * @memberof SparseEmbedding
     */
    sparseTokens?: Array<string>;
}

/**
 * Check if a given object implements the SparseEmbedding interface.
 */
export function instanceOfSparseEmbedding(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "sparseValues" in value;
    isInstance = isInstance && "sparseIndices" in value;

    return isInstance;
}

export function SparseEmbeddingFromJSON(json: any): SparseEmbedding {
    return SparseEmbeddingFromJSONTyped(json, false);
}

export function SparseEmbeddingFromJSONTyped(json: any, ignoreDiscriminator: boolean): SparseEmbedding {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'sparseValues': json['sparse_values'],
        'sparseIndices': json['sparse_indices'],
        'sparseTokens': !exists(json, 'sparse_tokens') ? undefined : json['sparse_tokens'],
    };
}

export function SparseEmbeddingToJSON(value?: SparseEmbedding | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'sparse_values': value.sparseValues,
        'sparse_indices': value.sparseIndices,
        'sparse_tokens': value.sparseTokens,
    };
}

