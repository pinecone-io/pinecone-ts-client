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
import type { RankedDocument } from './RankedDocument';
import {
    RankedDocumentFromJSON,
    RankedDocumentFromJSONTyped,
    RankedDocumentToJSON,
} from './RankedDocument';
import type { RerankResultUsage } from './RerankResultUsage';
import {
    RerankResultUsageFromJSON,
    RerankResultUsageFromJSONTyped,
    RerankResultUsageToJSON,
} from './RerankResultUsage';

/**
 * The result of a reranking request.
 * @export
 * @interface RerankResult
 */
export interface RerankResult {
    /**
     * The model used to rerank documents.
     * @type {string}
     * @memberof RerankResult
     */
    model: string;
    /**
     * The reranked documents.
     * @type {Array<RankedDocument>}
     * @memberof RerankResult
     */
    data: Array<RankedDocument>;
    /**
     * 
     * @type {RerankResultUsage}
     * @memberof RerankResult
     */
    usage: RerankResultUsage;
}

/**
 * Check if a given object implements the RerankResult interface.
 */
export function instanceOfRerankResult(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "model" in value;
    isInstance = isInstance && "data" in value;
    isInstance = isInstance && "usage" in value;

    return isInstance;
}

export function RerankResultFromJSON(json: any): RerankResult {
    return RerankResultFromJSONTyped(json, false);
}

export function RerankResultFromJSONTyped(json: any, ignoreDiscriminator: boolean): RerankResult {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'model': json['model'],
        'data': ((json['data'] as Array<any>).map(RankedDocumentFromJSON)),
        'usage': RerankResultUsageFromJSON(json['usage']),
    };
}

export function RerankResultToJSON(value?: RerankResult | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'model': value.model,
        'data': ((value.data as Array<any>).map(RankedDocumentToJSON)),
        'usage': RerankResultUsageToJSON(value.usage),
    };
}

