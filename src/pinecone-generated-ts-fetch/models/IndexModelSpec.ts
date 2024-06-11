/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-07
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { PodSpec } from './PodSpec';
import {
    PodSpecFromJSON,
    PodSpecFromJSONTyped,
    PodSpecToJSON,
} from './PodSpec';
import type { ServerlessSpec } from './ServerlessSpec';
import {
    ServerlessSpecFromJSON,
    ServerlessSpecFromJSONTyped,
    ServerlessSpecToJSON,
} from './ServerlessSpec';

/**
 * 
 * @export
 * @interface IndexModelSpec
 */
export interface IndexModelSpec {
    /**
     * 
     * @type {PodSpec}
     * @memberof IndexModelSpec
     */
    pod?: PodSpec;
    /**
     * 
     * @type {ServerlessSpec}
     * @memberof IndexModelSpec
     */
    serverless?: ServerlessSpec;
}

/**
 * Check if a given object implements the IndexModelSpec interface.
 */
export function instanceOfIndexModelSpec(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function IndexModelSpecFromJSON(json: any): IndexModelSpec {
    return IndexModelSpecFromJSONTyped(json, false);
}

export function IndexModelSpecFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexModelSpec {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'pod': !exists(json, 'pod') ? undefined : PodSpecFromJSON(json['pod']),
        'serverless': !exists(json, 'serverless') ? undefined : ServerlessSpecFromJSON(json['serverless']),
    };
}

export function IndexModelSpecToJSON(value?: IndexModelSpec | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'pod': PodSpecToJSON(value.pod),
        'serverless': ServerlessSpecToJSON(value.serverless),
    };
}

