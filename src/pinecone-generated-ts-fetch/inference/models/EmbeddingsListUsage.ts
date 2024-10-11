/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Inference API
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
 * Usage statistics for the model inference.
 * @export
 * @interface EmbeddingsListUsage
 */
export interface EmbeddingsListUsage {
    /**
     * Total number of tokens consumed across all inputs.
     * @type {number}
     * @memberof EmbeddingsListUsage
     */
    totalTokens?: number;
}

/**
 * Check if a given object implements the EmbeddingsListUsage interface.
 */
export function instanceOfEmbeddingsListUsage(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function EmbeddingsListUsageFromJSON(json: any): EmbeddingsListUsage {
    return EmbeddingsListUsageFromJSONTyped(json, false);
}

export function EmbeddingsListUsageFromJSONTyped(json: any, ignoreDiscriminator: boolean): EmbeddingsListUsage {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'totalTokens': !exists(json, 'total_tokens') ? undefined : json['total_tokens'],
    };
}

export function EmbeddingsListUsageToJSON(value?: EmbeddingsListUsage | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'total_tokens': value.totalTokens,
    };
}

