/* tslint:disable */
/* eslint-disable */
/**
 * Evaluation API
 * Provides endpoints for evaluating RAG systems using various metrics.
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
 * Token counts for the input prompt and completion.
 * @export
 * @interface TokenCounts
 */
export interface TokenCounts {
    /**
     * 
     * @type {number}
     * @memberof TokenCounts
     */
    promptTokens: number;
    /**
     * 
     * @type {number}
     * @memberof TokenCounts
     */
    completionTokens: number;
    /**
     * 
     * @type {number}
     * @memberof TokenCounts
     */
    totalTokens: number;
}

/**
 * Check if a given object implements the TokenCounts interface.
 */
export function instanceOfTokenCounts(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "promptTokens" in value;
    isInstance = isInstance && "completionTokens" in value;
    isInstance = isInstance && "totalTokens" in value;

    return isInstance;
}

export function TokenCountsFromJSON(json: any): TokenCounts {
    return TokenCountsFromJSONTyped(json, false);
}

export function TokenCountsFromJSONTyped(json: any, ignoreDiscriminator: boolean): TokenCounts {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'promptTokens': json['prompt_tokens'],
        'completionTokens': json['completion_tokens'],
        'totalTokens': json['total_tokens'],
    };
}

export function TokenCountsToJSON(value?: TokenCounts | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'prompt_tokens': value.promptTokens,
        'completion_tokens': value.completionTokens,
        'total_tokens': value.totalTokens,
    };
}

