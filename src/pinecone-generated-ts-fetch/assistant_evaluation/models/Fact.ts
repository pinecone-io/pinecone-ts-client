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
 * A fact
 * @export
 * @interface Fact
 */
export interface Fact {
    /**
     * The content of the fact.
     * @type {string}
     * @memberof Fact
     */
    content: string;
}

/**
 * Check if a given object implements the Fact interface.
 */
export function instanceOfFact(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "content" in value;

    return isInstance;
}

export function FactFromJSON(json: any): Fact {
    return FactFromJSONTyped(json, false);
}

export function FactFromJSONTyped(json: any, ignoreDiscriminator: boolean): Fact {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'content': json['content'],
    };
}

export function FactToJSON(value?: Fact | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'content': value.content,
    };
}

