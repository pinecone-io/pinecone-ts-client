/* tslint:disable */
/* eslint-disable */
/**
 * Evaluation API
 * Provides endpoints for evaluating RAG systems using various metrics.
 *
 * The version of the OpenAPI document: 2025-04
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * The metrics returned for the alignment evaluation.
 * @export
 * @interface Metrics
 */
export interface Metrics {
    /**
     * The precision of the generated answer.
     * @type {number}
     * @memberof Metrics
     */
    correctness: number;
    /**
     * The recall of the generated answer.
     * @type {number}
     * @memberof Metrics
     */
    completeness: number;
    /**
     * The harmonic mean of correctness and completeness.
     * @type {number}
     * @memberof Metrics
     */
    alignment: number;
}

/**
 * Check if a given object implements the Metrics interface.
 */
export function instanceOfMetrics(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "correctness" in value;
    isInstance = isInstance && "completeness" in value;
    isInstance = isInstance && "alignment" in value;

    return isInstance;
}

export function MetricsFromJSON(json: any): Metrics {
    return MetricsFromJSONTyped(json, false);
}

export function MetricsFromJSONTyped(json: any, ignoreDiscriminator: boolean): Metrics {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'correctness': json['correctness'],
        'completeness': json['completeness'],
        'alignment': json['alignment'],
    };
}

export function MetricsToJSON(value?: Metrics | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'correctness': value.correctness,
        'completeness': value.completeness,
        'alignment': value.alignment,
    };
}

