/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Control Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge  from millions of documents at scale. This API supports creating and managing assistants. 
 *
 * The version of the OpenAPI document: 2025-04
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { Assistant } from './Assistant';
import {
    AssistantFromJSON,
    AssistantFromJSONTyped,
    AssistantToJSON,
} from './Assistant';

/**
 * The list of assistants that exist in the project.
 * @export
 * @interface ListAssistants200Response
 */
export interface ListAssistants200Response {
    /**
     * 
     * @type {Array<Assistant>}
     * @memberof ListAssistants200Response
     */
    assistants?: Array<Assistant>;
}

/**
 * Check if a given object implements the ListAssistants200Response interface.
 */
export function instanceOfListAssistants200Response(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ListAssistants200ResponseFromJSON(json: any): ListAssistants200Response {
    return ListAssistants200ResponseFromJSONTyped(json, false);
}

export function ListAssistants200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListAssistants200Response {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'assistants': !exists(json, 'assistants') ? undefined : ((json['assistants'] as Array<any>).map(AssistantFromJSON)),
    };
}

export function ListAssistants200ResponseToJSON(value?: ListAssistants200Response | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'assistants': value.assistants === undefined ? undefined : ((value.assistants as Array<any>).map(AssistantToJSON)),
    };
}

