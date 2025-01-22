/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Data Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge from millions of documents at scale. This API supports interactions with assistants.
 *
 * The version of the OpenAPI document: 2025-01
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { AssistantFileModel } from './AssistantFileModel';
import {
    AssistantFileModelFromJSON,
    AssistantFileModelFromJSONTyped,
    AssistantFileModelToJSON,
} from './AssistantFileModel';

/**
 * The list of files that exist in the assistant
 * @export
 * @interface ListFiles200Response
 */
export interface ListFiles200Response {
    /**
     * 
     * @type {Array<AssistantFileModel>}
     * @memberof ListFiles200Response
     */
    files?: Array<AssistantFileModel>;
}

/**
 * Check if a given object implements the ListFiles200Response interface.
 */
export function instanceOfListFiles200Response(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ListFiles200ResponseFromJSON(json: any): ListFiles200Response {
    return ListFiles200ResponseFromJSONTyped(json, false);
}

export function ListFiles200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListFiles200Response {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'files': !exists(json, 'files') ? undefined : ((json['files'] as Array<any>).map(AssistantFileModelFromJSON)),
    };
}

export function ListFiles200ResponseToJSON(value?: ListFiles200Response | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'files': value.files === undefined ? undefined : ((value.files as Array<any>).map(AssistantFileModelToJSON)),
    };
}

