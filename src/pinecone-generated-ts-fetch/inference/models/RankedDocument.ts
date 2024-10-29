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
 * A ranked document with a relevance score and an index position.
 * @export
 * @interface RankedDocument
 */
export interface RankedDocument {
    /**
     * The index of the document
     * @type {number}
     * @memberof RankedDocument
     */
    index: number;
    /**
     * The relevance score of the document normalized between 0 and 1. 
     * @type {number}
     * @memberof RankedDocument
     */
    score: number;
    /**
     * Document for reranking
     * @type {{ [key: string]: string; }}
     * @memberof RankedDocument
     */
    document?: { [key: string]: string; };
}

/**
 * Check if a given object implements the RankedDocument interface.
 */
export function instanceOfRankedDocument(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "index" in value;
    isInstance = isInstance && "score" in value;

    return isInstance;
}

export function RankedDocumentFromJSON(json: any): RankedDocument {
    return RankedDocumentFromJSONTyped(json, false);
}

export function RankedDocumentFromJSONTyped(json: any, ignoreDiscriminator: boolean): RankedDocument {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'index': json['index'],
        'score': json['score'],
        'document': !exists(json, 'document') ? undefined : json['document'],
    };
}

export function RankedDocumentToJSON(value?: RankedDocument | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'index': value.index,
        'score': value.score,
        'document': value.document,
    };
}

