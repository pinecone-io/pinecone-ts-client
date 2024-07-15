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
/**
 * Configuration needed to deploy a serverless index.
 * @export
 * @interface ServerlessSpec
 */
export interface ServerlessSpec {
    /**
     * The public cloud where you would like your index hosted.
     * @type {string}
     * @memberof ServerlessSpec
     */
    cloud: ServerlessSpecCloudEnum;
    /**
     * The region where you would like your index to be created. 
     * @type {string}
     * @memberof ServerlessSpec
     */
    region: string;
}


/**
 * @export
 */
export const ServerlessSpecCloudEnum = {
    Gcp: 'gcp',
    Aws: 'aws',
    Azure: 'azure'
} as const;
export type ServerlessSpecCloudEnum = typeof ServerlessSpecCloudEnum[keyof typeof ServerlessSpecCloudEnum];


/**
 * Check if a given object implements the ServerlessSpec interface.
 */
export function instanceOfServerlessSpec(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "cloud" in value;
    isInstance = isInstance && "region" in value;

    return isInstance;
}

export function ServerlessSpecFromJSON(json: any): ServerlessSpec {
    return ServerlessSpecFromJSONTyped(json, false);
}

export function ServerlessSpecFromJSONTyped(json: any, ignoreDiscriminator: boolean): ServerlessSpec {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'cloud': json['cloud'],
        'region': json['region'],
    };
}

export function ServerlessSpecToJSON(value?: ServerlessSpec | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'cloud': value.cloud,
        'region': value.region,
    };
}

