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
import type { NamespaceSummary } from './NamespaceSummary';
import {
    NamespaceSummaryFromJSON,
    NamespaceSummaryFromJSONTyped,
    NamespaceSummaryToJSON,
} from './NamespaceSummary';

/**
 * The response for the `describe_index_stats` operation.
 * @export
 * @interface DescribeIndexStatsResponse
 */
export interface DescribeIndexStatsResponse {
    /**
     * A mapping for each namespace in the index from the namespace name to a
     * summary of its contents. If a metadata filter expression is present, the
     * summary will reflect only vectors matching that expression.
     * @type {{ [key: string]: NamespaceSummary; }}
     * @memberof DescribeIndexStatsResponse
     */
    namespaces?: { [key: string]: NamespaceSummary; };
    /**
     * The dimension of the indexed vectors.
     * @type {number}
     * @memberof DescribeIndexStatsResponse
     */
    dimension?: number;
    /**
     * The fullness of the index, regardless of whether a metadata filter expression was passed. The granularity of this metric is 10%.
     * @type {number}
     * @memberof DescribeIndexStatsResponse
     */
    indexFullness?: number;
    /**
     * 
     * @type {number}
     * @memberof DescribeIndexStatsResponse
     */
    totalVectorCount?: number;
}

/**
 * Check if a given object implements the DescribeIndexStatsResponse interface.
 */
export function instanceOfDescribeIndexStatsResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function DescribeIndexStatsResponseFromJSON(json: any): DescribeIndexStatsResponse {
    return DescribeIndexStatsResponseFromJSONTyped(json, false);
}

export function DescribeIndexStatsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): DescribeIndexStatsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'namespaces': !exists(json, 'namespaces') ? undefined : (mapValues(json['namespaces'], NamespaceSummaryFromJSON)),
        'dimension': !exists(json, 'dimension') ? undefined : json['dimension'],
        'indexFullness': !exists(json, 'indexFullness') ? undefined : json['indexFullness'],
        'totalVectorCount': !exists(json, 'totalVectorCount') ? undefined : json['totalVectorCount'],
    };
}

export function DescribeIndexStatsResponseToJSON(value?: DescribeIndexStatsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'namespaces': value.namespaces === undefined ? undefined : (mapValues(value.namespaces, NamespaceSummaryToJSON)),
        'dimension': value.dimension,
        'indexFullness': value.indexFullness,
        'totalVectorCount': value.totalVectorCount,
    };
}

