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


/**
 * The entailment of a fact.
 * @export
 */
export const Entailment = {
    Entailed: 'entailed',
    Contradicted: 'contradicted',
    Neutral: 'neutral'
} as const;
export type Entailment = typeof Entailment[keyof typeof Entailment];


export function EntailmentFromJSON(json: any): Entailment {
    return EntailmentFromJSONTyped(json, false);
}

export function EntailmentFromJSONTyped(json: any, ignoreDiscriminator: boolean): Entailment {
    return json as Entailment;
}

export function EntailmentToJSON(value?: Entailment | null): any {
    return value as any;
}

