/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
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
/**
 * 
 * @export
 * @interface IndexModelStatus
 */
export interface IndexModelStatus {
    /**
     * 
     * @type {boolean}
     * @memberof IndexModelStatus
     */
    ready: boolean;
    /**
     * 
     * @type {string}
     * @memberof IndexModelStatus
     */
    state: IndexModelStatusStateEnum;
}


/**
 * @export
 */
export const IndexModelStatusStateEnum = {
    Initializing: 'Initializing',
    InitializationFailed: 'InitializationFailed',
    ScalingUp: 'ScalingUp',
    ScalingDown: 'ScalingDown',
    ScalingUpPodSize: 'ScalingUpPodSize',
    ScalingDownPodSize: 'ScalingDownPodSize',
    Terminating: 'Terminating',
    Ready: 'Ready'
} as const;
export type IndexModelStatusStateEnum = typeof IndexModelStatusStateEnum[keyof typeof IndexModelStatusStateEnum];


/**
 * Check if a given object implements the IndexModelStatus interface.
 */
export function instanceOfIndexModelStatus(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "ready" in value;
    isInstance = isInstance && "state" in value;

    return isInstance;
}

export function IndexModelStatusFromJSON(json: any): IndexModelStatus {
    return IndexModelStatusFromJSONTyped(json, false);
}

export function IndexModelStatusFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexModelStatus {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ready': json['ready'],
        'state': json['state'],
    };
}

export function IndexModelStatusToJSON(value?: IndexModelStatus | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ready': value.ready,
        'state': value.state,
    };
}

