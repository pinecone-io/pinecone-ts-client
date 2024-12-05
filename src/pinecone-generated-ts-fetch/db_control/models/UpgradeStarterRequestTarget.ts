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
import type { PodUpgradeTargetServerless } from './PodUpgradeTargetServerless';
import {
    PodUpgradeTargetServerlessFromJSON,
    PodUpgradeTargetServerlessFromJSONTyped,
    PodUpgradeTargetServerlessToJSON,
} from './PodUpgradeTargetServerless';

/**
 * The configuration for the target index.
 * @export
 * @interface UpgradeStarterRequestTarget
 */
export interface UpgradeStarterRequestTarget {
    /**
     * 
     * @type {PodUpgradeTargetServerless}
     * @memberof UpgradeStarterRequestTarget
     */
    serverless?: PodUpgradeTargetServerless;
}

/**
 * Check if a given object implements the UpgradeStarterRequestTarget interface.
 */
export function instanceOfUpgradeStarterRequestTarget(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpgradeStarterRequestTargetFromJSON(json: any): UpgradeStarterRequestTarget {
    return UpgradeStarterRequestTargetFromJSONTyped(json, false);
}

export function UpgradeStarterRequestTargetFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpgradeStarterRequestTarget {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serverless': !exists(json, 'serverless') ? undefined : PodUpgradeTargetServerlessFromJSON(json['serverless']),
    };
}

export function UpgradeStarterRequestTargetToJSON(value?: UpgradeStarterRequestTarget | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'serverless': PodUpgradeTargetServerlessToJSON(value.serverless),
    };
}

