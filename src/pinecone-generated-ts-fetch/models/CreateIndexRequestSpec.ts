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
 * The spec object defines how the index should be deployed.
 * 
 * For serverless indexes, you define only the cloud and region where the index should be hosted. For pod-based indexes, you define the environment where the index should be hosted, the pod type and size to use, and other index characteristics.
 * 
 * Serverless indexes are in public preview and are available only on AWS in the us-west-2 and us-east-1 regions. Test thoroughly before using serverless indexes in production.
 * @export
 * @interface CreateIndexRequestSpec
 */
export interface CreateIndexRequestSpec {
    /**
     * 
     * @type {ServerlessSpec}
     * @memberof CreateIndexRequestSpec
     */
    serverless?: ServerlessSpec;
    /**
     * 
     * @type {PodSpec}
     * @memberof CreateIndexRequestSpec
     */
    pod?: PodSpec;
}

/**
 * Check if a given object implements the CreateIndexRequestSpec interface.
 */
export function instanceOfCreateIndexRequestSpec(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CreateIndexRequestSpecFromJSON(json: any): CreateIndexRequestSpec {
    return CreateIndexRequestSpecFromJSONTyped(json, false);
}

export function CreateIndexRequestSpecFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateIndexRequestSpec {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serverless': !exists(json, 'serverless') ? undefined : ServerlessSpecFromJSON(json['serverless']),
        'pod': !exists(json, 'pod') ? undefined : PodSpecFromJSON(json['pod']),
    };
}

export function CreateIndexRequestSpecToJSON(value?: CreateIndexRequestSpec | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'serverless': ServerlessSpecToJSON(value.serverless),
        'pod': PodSpecToJSON(value.pod),
    };
}

